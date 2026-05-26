const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const { upload, uploadToCloudinary } = require('../middleware/upload.middleware');
const eventController = require('../controllers/event.controller');
const ticketController = require('../controllers/ticket.controller');

router.get('/', eventController.listEvents);
router.get('/featured', eventController.featuredEvents);

router.get('/mine', auth, requireRole('organiser', 'admin'), eventController.myEvents);
router.post('/', auth, requireRole('organiser', 'admin'), upload.single('bannerImage'), uploadToCloudinary, eventController.createEvent);
router.put('/:id', auth, requireRole('organiser', 'admin'), upload.single('bannerImage'), uploadToCloudinary, eventController.updateEvent);
router.delete('/:id', auth, requireRole('organiser', 'admin'), eventController.deleteEvent);
router.get('/:id/dashboard', auth, requireRole('organiser', 'admin'), eventController.eventDashboard);
router.get('/:id/attendees', auth, requireRole('organiser', 'admin'), eventController.attendees);
router.post('/:id/tickets', auth, requireRole('organiser', 'admin'), ticketController.createTicketType);

router.get('/:id', eventController.getEvent);

module.exports = router;

