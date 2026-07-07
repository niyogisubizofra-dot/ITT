const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { authenticate, managerUp } = require('../middleware/auth');

router.use(authenticate, managerUp);

router.get('/summary', ctrl.getSummary);
router.get('/revenue-chart', ctrl.getRevenueChart);
router.get('/project-performance', ctrl.getProjectPerformance);
router.get('/staff-performance', ctrl.getStaffPerformance);
router.get('/client-growth', ctrl.getClientGrowth);

module.exports = router;
