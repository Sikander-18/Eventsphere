const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  organiser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: String,
  category: {
    type: String,
    enum: ['Tech', 'Music', 'Business', 'Sports', 'Art', 'Education', 'Other'],
    default: 'Other'
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  venue: {
    name: String,
    address: String,
    city: String,
    lat: Number,
    lng: Number,
    isOnline: { type: Boolean, default: false },
    onlineLink: String
  },
  bannerImage: String,
  status: {
    type: String,
    enum: ['draft', 'published', 'ended'],
    default: 'draft'
  },
  sessions: [{
    title: String,
    speaker: String,
    startTime: String,
    endTime: String,
    duration: Number,
    description: String
  }],
  speakers: [{ name: String, bio: String, photo: String }],
  faqs: [{ question: String, answer: String }],
  isFeatured: { type: Boolean, default: false },
  totalRevenue: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

eventSchema.index({ title: 'text', description: 'text', 'venue.city': 'text' });

module.exports = mongoose.model('Event', eventSchema);

