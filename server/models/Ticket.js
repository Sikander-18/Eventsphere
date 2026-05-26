const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  ticketType: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketType' },
  ticketTypeName: String,
  qrCodeData: String,
  qrCodeImage: String,
  checkedIn: { type: Boolean, default: false },
  checkedInAt: Date,
  shareLinkedIn: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

ticketSchema.index({ user: 1, event: 1 }, { unique: true });
ticketSchema.index({ event: 1, checkedIn: 1 });
ticketSchema.index({ order: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
