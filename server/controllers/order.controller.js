const Event = require('../models/Event');
const Order = require('../models/Order');
const Ticket = require('../models/Ticket');
const TicketType = require('../models/TicketType');
const User = require('../models/User');
const { generateQR } = require('../services/qr.service');
const { createOrder: createRazorpayOrder, verifySignature } = require('../services/razorpay.service');
const { sendTicketConfirmation } = require('../services/mail.service');

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

  const ticketTypes = await TicketType.find({ _id: { $in: cleanItems.map((item) => item.ticketTypeId) } });
  const ticketMap = new Map(ticketTypes.map((ticketType) => [String(ticketType._id), ticketType]));

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
    if (ticketType.sold + item.quantity > ticketType.capacity) {
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

const issueTicketsForOrder = async (order) => {
  if (order.tickets?.length) {
    return Ticket.find({ _id: { $in: order.tickets } });
  }

  const tickets = [];

  for (const item of order.items) {
    const ticketType = await TicketType.findById(item.ticketType);
    if (!ticketType || ticketType.sold + item.quantity > ticketType.capacity) {
      const error = new Error(`${item.name} no longer has enough capacity`);
      error.status = 409;
      throw error;
    }

    for (let index = 0; index < item.quantity; index += 1) {
      const ticket = await Ticket.create({
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

    ticketType.sold += item.quantity;
    if (order.discountCode) {
      const code = ticketType.discountCodes.find((discount) => (
        discount.code?.toLowerCase() === String(order.discountCode).toLowerCase()
      ));
      if (code) code.usedCount += item.quantity;
    }
    await ticketType.save();
  }

  order.tickets = tickets.map((ticket) => ticket._id);
  await order.save();
  await Event.findByIdAndUpdate(order.event, { $inc: { totalRevenue: order.total } });

  const [user, hydratedOrder] = await Promise.all([
    User.findById(order.user),
    Order.findById(order._id)
  ]);
  if (user) await sendTicketConfirmation(user, hydratedOrder || order, tickets);

  return tickets;
};

exports.createOrder = async (req, res) => {
  try {
    if (req.user.role !== 'attendee') {
      return res.status(403).json({ message: 'Organisers and Admins cannot purchase tickets' });
    }
    const { eventId, items, discountCode } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

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
      const tickets = await issueTicketsForOrder(order);
      return res.status(201).json({ success: true, freeCheckout: true, tickets });
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

    if (order.paymentStatus === 'paid') {
      const existingTickets = await Ticket.find({ _id: { $in: order.tickets } });
      return res.json({ success: true, tickets: existingTickets });
    }

    const valid = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!valid) return res.status(400).json({ message: 'Invalid Razorpay signature' });

    order.paymentStatus = 'paid';
    order.razorpayPaymentId = razorpayPaymentId;
    await order.save();

    const tickets = await issueTicketsForOrder(order);
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

