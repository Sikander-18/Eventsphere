const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const { checkinStatsForEvent, emitRegistrationUpdate } = require('../services/ticketing.service');

const extractTicketId = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const parsed = JSON.parse(raw);
    return parsed.ticketId || parsed._id || raw;
  } catch {
    const match = raw.match(/[a-f0-9]{24}/i);
    return match ? match[0] : raw;
  }
};

exports.checkIn = async (req, res) => {
  try {
    const ticketId = extractTicketId(req.body.ticketId || req.body.qrCodeData);
    if (!ticketId || !/^[a-f0-9]{24}$/i.test(ticketId)) {
      return res.status(400).json({ message: 'Invalid ticket QR data' });
    }
    const ticket = await Ticket.findById(ticketId).populate('event');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const event = ticket.event;
    if (req.body.eventId && String(event._id) !== String(req.body.eventId)) {
      return res.status(400).json({ message: 'Ticket does not belong to this event' });
    }
    if (req.user.role !== 'admin' && String(event.organiser) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (ticket.checkedIn) return res.status(400).json({ message: 'Ticket already checked in' });

    ticket.checkedIn = true;
    ticket.checkedInAt = new Date();
    await ticket.save();

    const stats = await checkinStatsForEvent(event._id);
    req.app.get('io').to(String(event._id)).emit('checkin:update', { eventId: event._id, ticketId: ticket._id, stats });
    await emitRegistrationUpdate(req.app, event._id);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.stats = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (req.user.role !== 'admin' && String(event.organiser) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(await checkinStatsForEvent(event._id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
