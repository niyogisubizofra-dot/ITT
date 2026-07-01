const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// All dashboard endpoints require CEO or Chairman authorization
router.use(auth);
router.use(authorize(['CEO', 'Chairman']));

router.get('/summary', dashboardController.getSummary);
router.get('/revenue-chart', dashboardController.getRevenueChart);
router.get('/project-performance', dashboardController.getProjectPerformance);
router.get('/staff-performance', dashboardController.getStaffPerformance);
router.get('/client-growth', dashboardController.getClientGrowth);

module.exports = router;
