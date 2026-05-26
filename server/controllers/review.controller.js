const Order = require('../models/Order');
const Review = require('../models/Review');

exports.createReview = async (req, res) => {
  try {
    const { eventId, rating, comment } = req.body;
    const hasTicket = await Order.exists({
      user: req.user.id,
      event: eventId,
      paymentStatus: 'paid'
    });
    if (!hasTicket) return res.status(403).json({ message: 'Only attendees with paid/free confirmed tickets can review' });

    const review = await Review.findOneAndUpdate(
      { event: eventId, user: req.user.id },
      { rating, comment },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('user', 'name');
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.listReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ event: req.params.eventId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

