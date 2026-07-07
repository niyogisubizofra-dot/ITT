const router = require('express').Router();
const ctrl = require('../controllers/wallet.controller');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

// POST /api/withdraw
router.post('/', authenticate, [
  body('amount').isFloat({ min: 1 }).withMessage('Minimum withdrawal is 1 USDT'),
  body('address').notEmpty().withMessage('Withdrawal address required'),
], validate, ctrl.requestWithdrawal);

module.exports = router;
