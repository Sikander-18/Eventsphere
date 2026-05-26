const { Parser } = require('json2csv');
const Event = require('../models/Event');
const TicketType = require('../models/TicketType');
const Review = require('../models/Review');
const Ticket = require('../models/Ticket');
const { dashboardStatsForEvent } = require('../services/ticketing.service');

const parseJson = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const eventPayload = (body, fileUrl) => ({
  title: body.title,
  description: body.description,
  category: body.category || 'Other',
  startDate: body.startDate,
  endDate: body.endDate,
  venue: parseJson(body.venue, {
    name: body.venueName,
    address: body.address,
    city: body.city,
    lat: body.lat ? Number(body.lat) : undefined,
    lng: body.lng ? Number(body.lng) : undefined,
    isOnline: body.isOnline === 'true' || body.isOnline === true,
    onlineLink: body.onlineLink
  }),
  bannerImage: fileUrl || body.bannerImage,
  status: body.status || 'published',
  sessions: parseJson(body.sessions, []),
  speakers: parseJson(body.speakers, []),
  faqs: parseJson(body.faqs, [])
});

const ownsEvent = (event, user) => (
  user.role === 'admin' ||
  String(event.organiser?._id || event.organiser) === String(user.id)
);

exports.listEvents = async (req, res) => {
  try {
    const { category, city, startDate, endDate, price, search } = req.query;
    const query = { status: { $in: ['published', 'ended'] } };

    if (category) query.category = category;
    if (city) query['venue.city'] = new RegExp(city, 'i');
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'venue.city': new RegExp(search, 'i') }
      ];
    }

    let events = await Event.find(query).populate('organiser', 'name email').sort({ startDate: 1 }).lean();

    if (price === 'free' || price === 'paid') {
      const eventIds = events.map((event) => event._id);
      const ticketTypes = await TicketType.find({ event: { $in: eventIds } }).lean();
      const priceMap = ticketTypes.reduce((acc, ticket) => {
        const id = String(ticket.event);
        acc[id] = acc[id] || { free: false, paid: false, min: Infinity };
        if (ticket.isFree || ticket.price === 0) acc[id].free = true;
        if (!ticket.isFree && ticket.price > 0) acc[id].paid = true;
        acc[id].min = Math.min(acc[id].min, ticket.price || 0);
        return acc;
      }, {});
      events = events
        .filter((event) => priceMap[String(event._id)]?.[price])
        .map((event) => ({ ...event, pricing: priceMap[String(event._id)] }));
    } else {
      const ticketTypes = await TicketType.find({ event: { $in: events.map((event) => event._id) } }).lean();
      const priceMap = ticketTypes.reduce((acc, ticket) => {
        const id = String(ticket.event);
        acc[id] = acc[id] || { min: Infinity, free: false, paid: false };
        acc[id].min = Math.min(acc[id].min, ticket.price || 0);
        if (ticket.isFree || ticket.price === 0) acc[id].free = true;
        if (!ticket.isFree && ticket.price > 0) acc[id].paid = true;
        return acc;
      }, {});
      events = events.map((event) => ({ ...event, pricing: priceMap[String(event._id)] }));
    }

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.featuredEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: 'published', isFeatured: true })
      .sort({ startDate: 1 })
      .limit(6)
      .lean();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organiser', 'name email linkedinUrl').lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const [ticketTypes, reviews, soldCounts] = await Promise.all([
      TicketType.find({ event: event._id }).lean(),
      Review.find({ event: event._id }).populate('user', 'name').sort({ createdAt: -1 }).lean(),
      Ticket.aggregate([
        { $match: { event: event._id } },
        { $group: { _id: '$ticketType', sold: { $sum: 1 } } }
      ])
    ]);
    const soldMap = new Map(soldCounts.map((item) => [String(item._id), item.sold]));
    const syncedTicketTypes = ticketTypes.map((ticketType) => ({
      ...ticketType,
      sold: soldMap.get(String(ticketType._id)) || 0
    }));

    res.json({ ...event, ticketTypes: syncedTicketTypes, reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const payload = eventPayload(req.body, req.fileUrl);
    const event = await Event.create({ ...payload, organiser: req.user.id });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!ownsEvent(event, req.user)) return res.status(403).json({ message: 'Forbidden' });

    Object.assign(event, eventPayload(req.body, req.fileUrl));
    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!ownsEvent(event, req.user)) return res.status(403).json({ message: 'Forbidden' });

    await TicketType.deleteMany({ event: event._id });
    await Event.deleteOne({ _id: event._id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.eventDashboard = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!ownsEvent(event, req.user)) return res.status(403).json({ message: 'Forbidden' });

    res.json(await dashboardStatsForEvent(event._id));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.attendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!ownsEvent(event, req.user)) return res.status(403).json({ message: 'Forbidden' });

    const tickets = await Ticket.find({ event: event._id })
      .populate('user', 'name email linkedinUrl')
      .sort({ createdAt: -1 })
      .lean();

    const rows = tickets.map((ticket) => ({
      name: ticket.user?.name,
      email: ticket.user?.email,
      linkedinUrl: ticket.shareLinkedIn ? ticket.user?.linkedinUrl : '',
      ticketType: ticket.ticketTypeName,
      checkedIn: ticket.checkedIn ? 'Yes' : 'No',
      checkedInAt: ticket.checkedInAt || ''
    }));

    if (req.query.format === 'csv') {
      const parser = new Parser();
      res.header('Content-Type', 'text/csv');
      res.attachment(`${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-attendees.csv`);
      return res.send(parser.parse(rows));
    }

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.myEvents = async (req, res) => {
  try {
    const events = await Event.find({ organiser: req.user.id }).sort({ startDate: -1 }).lean();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
