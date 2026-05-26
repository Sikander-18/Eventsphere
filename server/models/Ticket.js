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

module.exports = mongoose.model('Ticket', ticketSchema);

