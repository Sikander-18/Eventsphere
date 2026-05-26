const Event = require('../models/Event');
const Order = require('../models/Order');
const Ticket = require('../models/Ticket');
const TicketType = require('../models/TicketType');
const { createOrder: createRazorpayOrder, verifySignature } = require('../services/razorpay.service');
const {
  DUPLICATE_BOOKING_MESSAGE,
  ensureSingleTicketRequest,
  ensureTicketsHaveQR,
  hasConfirmedRegistration,
  issueTicketsForOrder
} = require('../services/ticketing.service');

const asItems = (items = []) => items
  .map((item) => ({
    ticketTypeId: item.ticketTypeId || item.ticketType,
    quantity: Math.max(1, Number(item.quantity || 1))
  }))
  .filter((item) => item.ticketTypeId);

const calculateOrder = async ({ eventId, items, discountCode }) => {
  const cleanItems = asItems(items);
  if (!eventId || cleanItems.length === 0) {
    const error = new Error('Event and ticket items are required');
    error.status = 400;
    throw error;
  }
  ensureSingleTicketRequest(cleanItems);

  const ticketTypes = await TicketType.find({ _id: { $in: cleanItems.map((item) => item.ticketTypeId) } });
  const ticketMap = new Map(ticketTypes.map((ticketType) => [String(ticketType._id), ticketType]));
  const soldTickets = await Ticket.find({
    event: eventId,
    ticketType: { $in: ticketTypes.map((ticketType) => ticketType._id) }
  }).select('ticketType').lean();
  const soldMap = soldTickets.reduce((acc, ticket) => {
    const key = String(ticket.ticketType);
    acc.set(key, (acc.get(key) || 0) + 1);
    return acc;
  }, new Map());

  let subtotal = 0;
  let discountApplied = 0;
  const orderItems = [];

  for (const item of cleanItems) {
    const ticketType = ticketMap.get(String(item.ticketTypeId));
    if (!ticketType) {
      const error = new Error('Invalid ticket type');
      error.status = 400;
      throw error;
    }
    if (String(ticketType.event) !== String(eventId)) {
      const error = new Error('Ticket type does not belong to selected event');
      error.status = 400;
      throw error;
    }
    if (ticketType.earlyBirdExpiry && new Date(ticketType.earlyBirdExpiry) < new Date()) {
      const error = new Error(`Ticket sales for "${ticketType.name}" have ended because the sale deadline has passed.`);
      error.status = 400;
      throw error;
    }
    const sold = Math.max(Number(ticketType.sold || 0), soldMap.get(String(ticketType._id)) || 0);
    if (sold + item.quantity > ticketType.capacity) {
      const error = new Error(`${ticketType.name} does not have enough capacity`);
      error.status = 409;
      throw error;
    }

    const pricePerUnit = ticketType.isFree ? 0 : Number(ticketType.price || 0);
    const lineTotal = pricePerUnit * item.quantity;
    subtotal += lineTotal;

    if (discountCode) {
      const code = ticketType.discountCodes.find((discount) => (
        discount.code?.toLowerCase() === String(discountCode).toLowerCase()
      ));
      const now = new Date();
      if (code && (!code.expiry || code.expiry > now) && (!code.usageLimit || code.usedCount < code.usageLimit)) {
        discountApplied += Math.round((lineTotal * Number(code.percentOff || 0)) / 100);
      }
    }

    orderItems.push({
      ticketType: ticketType._id,
      name: ticketType.name,
      quantity: item.quantity,
      pricePerUnit
    });
  }

  return {
    orderItems,
    subtotal,
    discountApplied,
    total: Math.max(0, subtotal - discountApplied)
  };
};

exports.createOrder = async (req, res) => {
  try {
    if (req.user.role !== 'attendee') {
      return res.status(403).json({ message: 'Organisers and Admins cannot purchase tickets' });
    }
    const { eventId, items, discountCode } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const existingTicket = await hasConfirmedRegistration(req.user.id, eventId);
    if (existingTicket) {
      return res.status(409).json({ message: DUPLICATE_BOOKING_MESSAGE });
    }

    const existingPaidOrder = await Order.findOne({
      user: req.user.id,
      event: eventId,
      paymentStatus: 'paid'
    });
    if (existingPaidOrder) {
      const tickets = await issueTicketsForOrder(existingPaidOrder, { app: req.app });
      return res.status(200).json({ success: true, alreadyConfirmed: true, tickets });
    }

    const totals = await calculateOrder({ eventId, items, discountCode });

    if (totals.total === 0) {
      const order = await Order.create({
        user: req.user.id,
        event: eventId,
        items: totals.orderItems,
        subtotal: totals.subtotal,
        discountApplied: totals.discountApplied,
        discountCode,
        total: 0,
        razorpayOrderId: `free_${Date.now()}`,
        paymentStatus: 'paid'
      });
      try {
        const tickets = await issueTicketsForOrder(order, { app: req.app });
        return res.status(201).json({ success: true, freeCheckout: true, tickets });
      } catch (error) {
        order.paymentStatus = 'failed';
        await order.save();
        throw error;
      }
    }

    const razorpayOrder = await createRazorpayOrder(totals.total);
    const order = await Order.create({
      user: req.user.id,
      event: eventId,
      items: totals.orderItems,
      subtotal: totals.subtotal,
      discountApplied: totals.discountApplied,
      discountCode,
      total: totals.total,
      razorpayOrderId: razorpayOrder.id,
      paymentStatus: 'pending'
    });

    res.status(201).json({
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency || 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || '',
      mockPayment: Boolean(razorpayOrder.mock)
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const order = await Order.findOne({ razorpayOrderId });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.user) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (order.paymentStatus === 'paid') {
      const existingTickets = await Ticket.find({ _id: { $in: order.tickets } });
      if (existingTickets.length) {
        return res.json({ success: true, tickets: await ensureTicketsHaveQR(existingTickets) });
      }
      try {
        const tickets = await issueTicketsForOrder(order, { app: req.app });
        return res.json({ success: true, tickets });
      } catch (error) {
        if (error.status === 409) {
          order.paymentStatus = 'failed';
          await order.save();
        }
        throw error;
      }
    }

    const valid = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!valid) return res.status(400).json({ message: 'Invalid Razorpay signature' });

    const duplicateRegistration = await hasConfirmedRegistration(order.user, order.event, order._id);
    if (duplicateRegistration) {
      order.paymentStatus = 'failed';
      order.razorpayPaymentId = razorpayPaymentId;
      await order.save();
      return res.status(409).json({ message: DUPLICATE_BOOKING_MESSAGE });
    }

    order.paymentStatus = 'paid';
    order.razorpayPaymentId = razorpayPaymentId;
    await order.save();

    let tickets;
    try {
      tickets = await issueTicketsForOrder(order, { app: req.app });
    } catch (error) {
      if (error.status === 409) {
        order.paymentStatus = 'failed';
        await order.save();
      }
      throw error;
    }
    res.json({ success: true, tickets });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

exports.myOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('event', 'title startDate venue bannerImage')
      .populate('tickets')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.requestRefund = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentStatus !== 'paid') return res.status(400).json({ message: 'Only paid orders can be refunded' });

    order.refundStatus = 'requested';
    order.refundReason = req.body.reason || '';
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.organiserRefunds = async (req, res) => {
  try {
    const events = await Event.find({ organiser: req.user.id }).select('_id');
    const orders = await Order.find({
      event: { $in: events.map((event) => event._id) },
      refundStatus: 'requested'
    })
      .populate('user', 'name email')
      .populate('event', 'title')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateRefund = async (req, res) => {
  try {
    const { action } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid refund action' });
    }

    const order = await Order.findById(req.params.id).populate('event');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user.role !== 'admin' && String(order.event.organiser) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    order.refundStatus = action === 'approve' ? 'approved' : 'rejected';
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
