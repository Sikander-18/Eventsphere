const Event = require('../models/Event');
const Order = require('../models/Order');
const User = require('../models/User');
const ai = require('../services/ai.service');

exports.description = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await ai.streamDescription(req.body.bullets || '');
    for await (const chunk of stream) {
      const text = chunk.choices?.[0]?.delta?.content || '';
      if (text) res.write(`data: ${text.replace(/\n/g, '\\n')}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
};

exports.schedule = async (req, res) => {
  try {
    const ordered = await ai.buildSchedule(req.body.sessions || []);
    res.json(ordered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.recommendations = async (req, res) => {
  try {
    const [orders, user, events] = await Promise.all([
      Order.find({ user: req.user.id, paymentStatus: 'paid' }).populate('event', 'category').lean(),
      User.findById(req.user.id).populate('wishlist', 'category').lean(),
      Event.find({ status: 'published', startDate: { $gte: new Date() } })
        .select('title category startDate venue isFeatured bannerImage')
        .limit(30)
        .lean()
    ]);

    const categories = [
      ...orders.map((order) => order.event?.category).filter(Boolean),
      ...(user?.wishlist || []).map((event) => event.category).filter(Boolean)
    ];

    try {
      const ids = await ai.getRecommendations(categories, events);
      const sorted = ids
        .map((id) => events.find((event) => String(event._id) === String(id)))
        .filter(Boolean)
        .slice(0, 5);
      if (sorted.length) return res.json(sorted);
    } catch (error) {
      console.warn('Groq recommendations failed:', error.message);
    }

    const fallback = events
      .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 5);
    res.json(fallback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

