const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const orderController = require('../controllers/order.controller');

router.get('/refunds', auth, requireRole('organiser', 'admin'), orderController.organiserRefunds);

module.exports = router;

