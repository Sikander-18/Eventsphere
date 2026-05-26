const Event = require('../models/Event');
const TicketType = require('../models/TicketType');
const Ticket = require('../models/Ticket');

const parseDiscountCodes = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};

const canManageEvent = async (eventId, user) => {
  const event = await Event.findById(eventId);
  if (!event) return null;
  if (user.role !== 'admin' && String(event.organiser) !== String(user.id)) return false;
  return event;
};

exports.createTicketType = async (req, res) => {
  try {
    const event = await canManageEvent(req.params.id, req.user);
    if (!event) return res.status(event === null ? 404 : 403).json({ message: event === null ? 'Event not found' : 'Forbidden' });

    const ticketType = await TicketType.create({
      event: event._id,
      name: req.body.name,
      price: Number(req.body.price || 0),
      isFree: req.body.isFree === true || req.body.isFree === 'true' || Number(req.body.price || 0) === 0,
      capacity: Number(req.body.capacity || 0),
      earlyBirdExpiry: req.body.earlyBirdExpiry || undefined,
      discountCodes: parseDiscountCodes(req.body.discountCodes)
    });
    res.status(201).json(ticketType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTicketType = async (req, res) => {
  try {
    const ticketType = await TicketType.findById(req.params.id);
    if (!ticketType) return res.status(404).json({ message: 'Ticket type not found' });

    const event = await canManageEvent(ticketType.event, req.user);
    if (!event) return res.status(403).json({ message: 'Forbidden' });

    ticketType.name = req.body.name ?? ticketType.name;
    ticketType.price = req.body.price !== undefined ? Number(req.body.price) : ticketType.price;
    ticketType.isFree = req.body.isFree !== undefined
      ? req.body.isFree === true || req.body.isFree === 'true'
      : ticketType.isFree;
    ticketType.capacity = req.body.capacity !== undefined ? Number(req.body.capacity) : ticketType.capacity;
    ticketType.earlyBirdExpiry = req.body.earlyBirdExpiry || ticketType.earlyBirdExpiry;
    if (req.body.discountCodes !== undefined) ticketType.discountCodes = parseDiscountCodes(req.body.discountCodes);

    await ticketType.save();
    res.json(ticketType);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTicketType = async (req, res) => {
  try {
    const ticketType = await TicketType.findById(req.params.id);
    if (!ticketType) return res.status(404).json({ message: 'Ticket type not found' });

    const event = await canManageEvent(ticketType.event, req.user);
    if (!event) return res.status(403).json({ message: 'Forbidden' });

    await TicketType.deleteOne({ _id: ticketType._id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id })
      .populate('event', 'title startDate endDate venue bannerImage')
      .populate('ticketType')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

