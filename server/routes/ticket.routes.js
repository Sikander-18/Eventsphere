const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const controller = require('../controllers/ticket.controller');

router.get('/my', auth, requireRole('attendee', 'admin'), controller.getMyTickets);
router.put('/:id', auth, requireRole('organiser', 'admin'), controller.updateTicketType);
router.delete('/:id', auth, requireRole('organiser', 'admin'), controller.deleteTicketType);

module.exports = router;

