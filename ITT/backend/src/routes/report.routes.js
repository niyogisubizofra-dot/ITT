const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const { authenticate, managerUp } = require('../middleware/auth');

router.use(authenticate, managerUp);

router.get('/', ctrl.getAll);
router.get('/financial', ctrl.generateFinancialReport);
router.get('/hr', ctrl.generateHRReport);
router.get('/projects', ctrl.generateProjectReport);
router.delete('/:id', ctrl.remove);

module.exports = router;
