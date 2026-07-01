const express = require('express');
const router = express.Router();
const communicationController = require('../controllers/communicationController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');

router.use(auth);

// Announcements
router.get('/announcements', communicationController.getAllAnnouncements);
router.post('/announcements', authorize(['CEO', 'Chairman', 'HR Manager', 'Operations Manager']), communicationController.createAnnouncement);

// User notification messages
router.get('/notifications', communicationController.getUserNotifications);
router.put('/notifications/:id/read', communicationController.markNotificationRead);

// Direct communications
router.post('/email', authorize(['CEO', 'Chairman', 'HR Manager']), communicationController.sendEmailTrigger);
router.post('/sms', authorize(['CEO', 'Chairman', 'HR Manager']), communicationController.sendSMSTrigger);

module.exports = router;
