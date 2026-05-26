const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const controller = require('../controllers/order.controller');

router.post('/', auth, requireRole('attendee', 'admin'), controller.createOrder);
router.post('/verify', auth, requireRole('attendee', 'admin'), controller.verifyPayment);
router.get('/my', auth, requireRole('attendee', 'admin'), controller.myOrders);
router.get('/organiser/refunds', auth, requireRole('organiser', 'admin'), controller.organiserRefunds);
router.post('/:id/refund', auth, requireRole('attendee', 'admin'), controller.requestRefund);
router.put('/:id/refund', auth, requireRole('organiser', 'admin'), controller.updateRefund);

module.exports = router;

