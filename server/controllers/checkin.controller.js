const Event = require('../models/Event');
const Ticket = require('../models/Ticket');

const statsForEvent = async (eventId) => {
  const [totalRegistered, checkedIn] = await Promise.all([
    Ticket.countDocuments({ event: eventId }),
    Ticket.countDocuments({ event: eventId, checkedIn: true })
  ]);
  return { totalRegistered, checkedIn };
};

exports.checkIn = async (req, res) => {
  try {
    const { ticketId } = req.body;
    const ticket = await Ticket.findById(ticketId).populate('event');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const event = ticket.event;
    if (req.user.role !== 'admin' && String(event.organiser) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (ticket.checkedIn) return res.status(400).json({ message: 'Ticket already checked in' });

    ticket.checkedIn = true;
    ticket.checkedInAt = new Date();
    await ticket.save();

    const stats = await statsForEvent(event._id);
    req.app.get('io').to(String(event._id)).emit('checkin:update', { ticketId: ticket._id, stats });
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

    res.json(await statsForEvent(event._id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

