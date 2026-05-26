const Event = require('../models/Event');
const Order = require('../models/Order');
const Ticket = require('../models/Ticket');
const TicketType = require('../models/TicketType');
const User = require('../models/User');
const { generateQR } = require('./qr.service');
const { sendTicketConfirmation } = require('./mail.service');

const DUPLICATE_BOOKING_MESSAGE = 'You have already booked a ticket for this event';

const toId = (value) => value?._id || value;

const isDuplicateTicketError = (error) => error?.code === 11000;

const withStatus = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const ensureSingleTicketRequest = (items = []) => {
  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  if (totalQuantity !== 1) {
    throw withStatus('Only one ticket can be booked per event per attendee', 400);
  }
};

const hasConfirmedRegistration = async (userId, eventId, excludeOrderId) => {
  const query = { user: userId, event: eventId };
  if (excludeOrderId) query.order = { $ne: excludeOrderId };
  return Ticket.exists(query);
};

const ensureTicketQR = async (ticket) => {
  if (!ticket || (ticket.qrCodeData && ticket.qrCodeImage)) return ticket;

  const qr = await generateQR(ticket._id, toId(ticket.event), toId(ticket.user));
  ticket.qrCodeData = qr.qrCodeData;
  ticket.qrCodeImage = qr.qrCodeImage;
  await ticket.save();
  return ticket;
};

const ensureTicketsHaveQR = async (tickets = []) => Promise.all(tickets.map(ensureTicketQR));

const checkinStatsForEvent = async (eventId) => {
  const [registeredUsers, checkedInUsers] = await Promise.all([
    Ticket.distinct('user', { event: eventId }),
    Ticket.distinct('user', { event: eventId, checkedIn: true })
  ]);
  return { totalRegistered: registeredUsers.length, checkedIn: checkedInUsers.length };
};

const dashboardStatsForEvent = async (eventId) => {
  const [ticketStats, paidOrders] = await Promise.all([
    checkinStatsForEvent(eventId),
    Order.find({ event: eventId, paymentStatus: 'paid' }).select('total').lean()
  ]);

  return {
    revenue: paidOrders.reduce((sum, order) => sum + (order.total || 0), 0),
    totalRegistrations: ticketStats.totalRegistered,
    checkedIn: ticketStats.checkedIn,
    checkinPercent: ticketStats.totalRegistered
      ? Math.round((ticketStats.checkedIn / ticketStats.totalRegistered) * 100)
      : 0,
    orders: paidOrders.length
  };
};

const emitRegistrationUpdate = async (app, eventId) => {
  const io = app?.get?.('io');
  if (!io) return;

  const [checkinStats, dashboardStats] = await Promise.all([
    checkinStatsForEvent(eventId),
    dashboardStatsForEvent(eventId)
  ]);

  io.to(String(eventId)).emit('registration:update', {
    eventId,
    checkinStats,
    stats: dashboardStats
  });
};

const reserveTicketTypeCapacity = async (ticketTypeId, eventId, quantity) => {
  const ticketType = await TicketType.findOneAndUpdate(
    {
      _id: ticketTypeId,
      event: eventId,
      $expr: { $lte: [{ $add: ['$sold', quantity] }, '$capacity'] }
    },
    { $inc: { sold: quantity } },
    { new: true }
  );

  if (!ticketType) {
    throw withStatus('Selected ticket type no longer has enough capacity', 409);
  }

  return ticketType;
};

const rollbackTicketTypeCapacity = async (ticketTypeId, quantity) => {
  await TicketType.findByIdAndUpdate(ticketTypeId, { $inc: { sold: -quantity } });
};

const updateDiscountUsage = async (ticketType, discountCode, quantity) => {
  if (!discountCode) return;

  const code = ticketType.discountCodes.find((discount) => (
    discount.code?.toLowerCase() === String(discountCode).toLowerCase()
  ));
  if (!code) return;

  code.usedCount += quantity;
  await ticketType.save();
};

const syncTicketTypeSoldFloor = async (ticketTypeId, eventId) => {
  const actualSold = await Ticket.countDocuments({ ticketType: ticketTypeId, event: eventId });
  await TicketType.findByIdAndUpdate(ticketTypeId, { $max: { sold: actualSold } });
};

const issueTicketsForOrder = async (order, options = {}) => {
  if (order.tickets?.length) {
    const existingTickets = await Ticket.find({ _id: { $in: order.tickets } });
    return ensureTicketsHaveQR(existingTickets);
  }

  ensureSingleTicketRequest(order.items);

  const duplicateRegistration = await hasConfirmedRegistration(order.user, order.event, order._id);
  if (duplicateRegistration) {
    throw withStatus(DUPLICATE_BOOKING_MESSAGE, 409);
  }

  const tickets = [];

  for (const item of order.items) {
    const quantity = Number(item.quantity || 1);
    await syncTicketTypeSoldFloor(item.ticketType, order.event);
    const ticketType = await reserveTicketTypeCapacity(item.ticketType, order.event, quantity);

    try {
      for (let index = 0; index < quantity; index += 1) {
        const ticket = new Ticket({
          order: order._id,
          user: order.user,
          event: order.event,
          ticketType: item.ticketType,
          ticketTypeName: item.name
        });
        const qr = await generateQR(ticket._id, order.event, order.user);
        ticket.qrCodeData = qr.qrCodeData;
        ticket.qrCodeImage = qr.qrCodeImage;
        await ticket.save();
        tickets.push(ticket);
      }

      await updateDiscountUsage(ticketType, order.discountCode, quantity);
    } catch (error) {
      await rollbackTicketTypeCapacity(item.ticketType, quantity);
      if (isDuplicateTicketError(error)) {
        throw withStatus(DUPLICATE_BOOKING_MESSAGE, 409);
      }
      throw error;
    }
  }

  order.tickets = tickets.map((ticket) => ticket._id);
  await order.save();
  await Event.findByIdAndUpdate(order.event, { $inc: { totalRevenue: order.total } });

  if (options.notify !== false) {
    try {
      const [user, hydratedOrder] = await Promise.all([
        User.findById(order.user),
        Order.findById(order._id)
      ]);
      if (user) await sendTicketConfirmation(user, hydratedOrder || order, tickets);
    } catch (error) {
      console.error('Ticket confirmation email failed:', error.message);
    }
  }

  await emitRegistrationUpdate(options.app, order.event);

  return tickets;
};

module.exports = {
  DUPLICATE_BOOKING_MESSAGE,
  dashboardStatsForEvent,
  checkinStatsForEvent,
  emitRegistrationUpdate,
  ensureSingleTicketRequest,
  ensureTicketQR,
  ensureTicketsHaveQR,
  hasConfirmedRegistration,
  issueTicketsForOrder
};
