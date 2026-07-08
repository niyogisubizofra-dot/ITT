const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { authenticate, adminOnly } = require('../middleware/auth');

router.use(authenticate, adminOnly);

router.get('/stats', ctrl.getStats);
router.get('/revenue-chart', ctrl.getRevenueChart);
router.get('/users', ctrl.getUsers);
router.post('/users/:id/toggle-status', ctrl.toggleUserStatus);
router.delete('/users/:id', ctrl.deleteUser);
router.get('/transactions/pending', ctrl.getPendingTransactions);
router.post('/transactions/:id/approve', ctrl.approveTransaction);
router.post('/transactions/:id/reject', ctrl.rejectTransaction);
router.get('/investments', ctrl.getInvestments);
router.get('/broadcasts', ctrl.getBroadcasts);
router.post('/broadcasts', ctrl.createBroadcast);
// Chat & Conversation Management
router.get('/chat/history/:userId', ctrl.getChatHistory);
router.post('/chat/send', ctrl.sendChatMessage);
router.get('/conversations', ctrl.getConversations);
router.get('/conversations/:id/messages', ctrl.getConversationMessages);
router.patch('/conversations/:id/status', ctrl.updateConversationStatus);
router.patch('/conversations/:id/assign', ctrl.assignConversation);
router.patch('/conversations/:id/archive', ctrl.archiveConversation);
router.get('/admins', ctrl.getAdmins);

module.exports = router;
