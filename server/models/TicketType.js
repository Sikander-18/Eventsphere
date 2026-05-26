const mongoose = require('mongoose');

const discountCodeSchema = new mongoose.Schema({
  code: String,
  percentOff: Number,
  expiry: Date,
  usageLimit: Number,
  usedCount: { type: Number, default: 0 }
}, { _id: false });

const ticketTypeSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  isFree: { type: Boolean, default: false },
  capacity: { type: Number, required: true },
  sold: { type: Number, default: 0 },
  earlyBirdExpiry: Date,
  discountCodes: [discountCodeSchema]
}, { timestamps: true });

module.exports = mongoose.model('TicketType', ticketTypeSchema);

