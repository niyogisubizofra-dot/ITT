const router = require('express').Router();
const ctrl = require('../controllers/invest.controller');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

const investRules = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('productId').notEmpty().withMessage('Product ID required'),
];

// POST /api/invest
router.post('/', authenticate, investRules, validate, ctrl.createInvestment);

// POST /api/invest/claim
router.post('/claim', authenticate, [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
], validate, ctrl.claimProfit);

// GET /api/invest/my-investments
router.get('/my-investments', authenticate, ctrl.getMyInvestments);

module.exports = router;
