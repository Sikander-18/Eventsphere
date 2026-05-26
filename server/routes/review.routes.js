const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const controller = require('../controllers/review.controller');

router.post('/', auth, requireRole('attendee', 'admin'), controller.createReview);
router.get('/:eventId', controller.listReviews);

module.exports = router;

