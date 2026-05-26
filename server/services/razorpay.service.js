const Razorpay = require('razorpay');
const crypto = require('crypto');

const hasRazorpayConfig = () => process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;

const getRazorpay = () => {
  if (!hasRazorpayConfig()) return null;

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

const createOrder = async (amount, currency = 'INR') => {
  const razorpay = getRazorpay();
  const paise = Math.max(0, Math.round(amount * 100));

  if (!razorpay) {
    return {
      id: `mock_order_${Date.now()}`,
      amount: paise,
      currency,
      mock: true
    };
  }

  return razorpay.orders.create({
    amount: paise,
    currency,
    receipt: `evt_${Date.now()}`
  });
};

const verifySignature = (orderId, paymentId, signature) => {
  if (String(orderId).startsWith('mock_order_')) return true;
  if (!hasRazorpayConfig()) return false;

  const digest = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return digest === signature;
};

module.exports = { createOrder, verifySignature, hasRazorpayConfig };

