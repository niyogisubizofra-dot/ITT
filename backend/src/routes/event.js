const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');

router.use(auth);

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);
router.post('/', authorize(['CEO', 'Chairman', 'HR Manager', 'Operations Manager', 'Project Manager']), eventController.createEvent);
router.put('/:id', authorize(['CEO', 'Chairman', 'HR Manager', 'Operations Manager', 'Project Manager']), eventController.updateEvent);
router.delete('/:id', authorize(['CEO', 'Chairman', 'HR Manager', 'Operations Manager', 'Project Manager']), eventController.deleteEvent);

module.exports = router;
