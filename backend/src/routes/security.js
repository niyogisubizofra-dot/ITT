const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');

router.use(auth);
router.use(authorize(['CEO', 'Chairman']));

router.get('/activity-logs', securityController.getActivityLogs);
router.post('/backup', securityController.triggerManualBackup);

module.exports = router;
