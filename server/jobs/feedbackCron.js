const cron = require('node-cron');
const Event = require('../models/Event');
const Order = require('../models/Order');
const User = require('../models/User');
const { sendFeedbackRequest } = require('../services/mail.service');

const startFeedbackCron = () => {
  cron.schedule('*/30 * * * *', async () => {
    try {
      const endedEvents = await Event.find({
        endDate: { $lt: new Date() },
        status: { $ne: 'ended' }
      });

      for (const event of endedEvents) {
        event.status = 'ended';
        await event.save();

        const orders = await Order.find({ event: event._id, paymentStatus: 'paid' }).select('user').lean();
        const userIds = [...new Set(orders.map((order) => String(order.user)))];
        const users = await User.find({ _id: { $in: userIds } });

        await Promise.all(users.map((user) => sendFeedbackRequest(user, event)));
      }
    } catch (error) {
      console.warn('Feedback cron failed:', error.message);
    }
  });
};

module.exports = startFeedbackCron;

