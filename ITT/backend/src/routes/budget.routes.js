const router = require('express').Router();
const finCtrl = require('../controllers/finance.controller');
const { authenticate, managerUp } = require('../middleware/auth');

router.use(authenticate, managerUp);

router.get('/', finCtrl.getAllBudgets);
router.post('/', finCtrl.createBudget);
router.put('/:id', finCtrl.updateBudget);
router.delete('/:id', finCtrl.deleteBudget);

module.exports = router;
