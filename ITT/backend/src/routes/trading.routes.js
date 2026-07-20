const router = require('express').Router();
const ctrl = require('../controllers/trading.controller');
const { authenticate } = require('../middleware/auth');

// All trading routes require authentication
router.use(authenticate);

// User-facing trading endpoints
router.get('/status', ctrl.getTradingStatus);
router.get('/coins', ctrl.getCoins);
router.get('/wallet', ctrl.getWallet);
router.post('/transfer/deposit', ctrl.transferDeposit);
router.post('/transfer/withdraw', ctrl.transferWithdraw);
router.post('/buy', ctrl.buyCoin);
router.post('/sell', ctrl.sellCoin);
router.get('/portfolio', ctrl.getPortfolio);
router.get('/transactions', ctrl.getTransactions);

module.exports = router;
