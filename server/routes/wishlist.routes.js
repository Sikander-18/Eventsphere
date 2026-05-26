const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const controller = require('../controllers/wishlist.controller');

router.post('/:eventId', auth, requireRole('attendee', 'admin'), controller.add);
router.delete('/:eventId', auth, requireRole('attendee', 'admin'), controller.remove);
router.get('/', auth, requireRole('attendee', 'admin'), controller.list);

module.exports = router;

