const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const schemas = require('../validations/schemas');

router.use(auth);
router.use(authorize(['CEO', 'Chairman', 'Finance Manager']));

// Revenue
router.get('/revenue', financeController.getAllRevenues);
router.post('/revenue', validate(schemas.revenue), financeController.createRevenue);

// Expense
router.get('/expense', financeController.getAllExpenses);
router.post('/expense', validate(schemas.expense), financeController.createExpense);

// Budget
router.get('/budget', financeController.getAllBudgets);
router.post('/budget', validate(schemas.budget), financeController.createBudget);
router.put('/budget/:id', validate(schemas.budget), financeController.updateBudget);

// Reporting
router.get('/cash-flow', financeController.getCashFlowReport);
router.post('/report', financeController.generatePeriodReport);

module.exports = router;
