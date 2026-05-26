const QRCode = require('qrcode');

async function generateQR(ticketId, eventId, userId) {
  const data = JSON.stringify({ ticketId, eventId, userId });
  const base64 = await QRCode.toDataURL(data);
  return { qrCodeData: data, qrCodeImage: base64 };
}

module.exports = { generateQR };

