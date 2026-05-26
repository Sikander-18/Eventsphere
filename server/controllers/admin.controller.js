const Event = require('../models/Event');
const Order = require('../models/Order');
const User = require('../models/User');

exports.stats = async (req, res) => {
  try {
    const [events, users, paidOrders, categories] = await Promise.all([
      Event.countDocuments(),
      User.countDocuments(),
      Order.find({ paymentStatus: 'paid' }).select('total').lean(),
      Event.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
    ]);

    res.json({
      totalEvents: events,
      totalUsers: users,
      revenue: paidOrders.reduce((sum, order) => sum + (order.total || 0), 0),
      topCategories: categories
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.events = async (req, res) => {
  try {
    const events = await Event.find().populate('organiser', 'name email').sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleFeature = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    event.isFeatured = !event.isFeatured;
    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

