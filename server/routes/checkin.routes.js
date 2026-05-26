const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const controller = require('../controllers/checkin.controller');

router.post('/', auth, requireRole('organiser', 'admin'), controller.checkIn);
router.get('/:eventId/stats', auth, requireRole('organiser', 'admin'), controller.stats);

module.exports = router;

