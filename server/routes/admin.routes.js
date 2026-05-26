const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const controller = require('../controllers/admin.controller');

router.get('/stats', auth, requireRole('admin'), controller.stats);
router.get('/events', auth, requireRole('admin'), controller.events);
router.put('/events/:id/feature', auth, requireRole('admin'), controller.toggleFeature);

module.exports = router;

