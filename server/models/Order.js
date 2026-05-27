const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  items: [{
    ticketType: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketType' },
    name: String,
    quantity: Number,
    pricePerUnit: Number
  }],
  subtotal: { type: Number, default: 0 },
  discountApplied: { type: Number, default: 0 },
  discountCode: String,
  total: { type: Number, default: 0 },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  refundStatus: {
    type: String,
    enum: ['none', 'requested', 'approved', 'rejected'],
    default: 'none'
  },
  refundReason: String,
  tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
