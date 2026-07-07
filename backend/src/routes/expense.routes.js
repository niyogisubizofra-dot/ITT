const router = require('express').Router();
const finCtrl = require('../controllers/finance.controller');
const { authenticate, managerUp } = require('../middleware/auth');
const { financeRules } = require('../validations/common.validation');
const validate = require('../middleware/validate');

router.use(authenticate, managerUp);

router.get('/', finCtrl.getAllExpenses);
router.post('/', financeRules, validate, finCtrl.createExpense);
router.put('/:id', finCtrl.updateExpense);
router.patch('/:id/approve', finCtrl.approveExpense);
router.delete('/:id', finCtrl.deleteExpense);
router.get('/cash-flow', finCtrl.getCashFlow);

module.exports = router;
