const nodemailer = require('nodemailer');

const hasMailConfig = () => process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD;

const getTransporter = () => {
  if (!hasMailConfig()) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
};

const sendMail = async ({ to, subject, html, attachments = [] }) => {
  const transporter = getTransporter();
  if (!transporter || !to) {
    console.warn(`Skipped email "${subject}" because Gmail SMTP is not configured.`);
    return { skipped: true };
  }

  try {
    return await transporter.sendMail({
      from: `"EventSphere" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      attachments
    });
  } catch (error) {
    console.warn('Email send failed:', error.message);
    return { skipped: true, error: error.message };
  }
};

const sendTicketConfirmation = async (user, order, tickets) => {
  const attachments = tickets.map((ticket, index) => ({
    filename: `ticket-${index + 1}.png`,
    content: ticket.qrCodeImage.split(',')[1],
    encoding: 'base64'
  }));

  return sendMail({
    to: user.email,
    subject: 'Your EventSphere tickets are ready',
    html: `
      <h2>Ticket confirmation</h2>
      <p>Hi ${user.name}, your order for ${order.items.length} ticket type(s) is confirmed.</p>
      <p>Total paid: ₹${order.total}</p>
      <p>Your QR codes are attached and also available in your dashboard.</p>
    `,
    attachments
  });
};

const sendFeedbackRequest = async (user, event) => sendMail({
  to: user.email,
  subject: `How was ${event.title}?`,
  html: `
    <h2>Share your feedback</h2>
    <p>Thanks for attending ${event.title}. Please log in to EventSphere and leave a review.</p>
  `
});

module.exports = { sendMail, sendTicketConfirmation, sendFeedbackRequest };

