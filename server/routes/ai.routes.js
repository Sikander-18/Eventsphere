const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const controller = require('../controllers/ai.controller');

router.post('/description', auth, requireRole('organiser', 'admin'), controller.description);
router.post('/schedule', auth, requireRole('organiser', 'admin'), controller.schedule);
router.get('/recommendations', auth, controller.recommendations);

module.exports = router;

