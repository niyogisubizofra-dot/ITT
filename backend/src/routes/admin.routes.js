const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { authenticate, adminOnly } = require('../middleware/auth');

router.use(authenticate, adminOnly);

router.get('/stats', ctrl.getStats);
router.get('/revenue-chart', ctrl.getRevenueChart);
router.get('/users', ctrl.getUsers);
router.post('/users/:id/toggle-status', ctrl.toggleUserStatus);
router.get('/transactions/pending', ctrl.getPendingTransactions);
router.post('/transactions/:id/approve', ctrl.approveTransaction);
router.post('/transactions/:id/reject', ctrl.rejectTransaction);
router.get('/investments', ctrl.getInvestments);
router.get('/broadcasts', ctrl.getBroadcasts);
router.post('/broadcasts', ctrl.createBroadcast);
router.get('/chat/history/:userId', ctrl.getChatHistory);
router.post('/chat/send', ctrl.sendChatMessage);
router.get('/conversations', ctrl.getConversations);

module.exports = router;
