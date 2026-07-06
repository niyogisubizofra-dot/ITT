const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/stats', adminController.getStats);
router.get('/revenue-chart', adminController.getRevenueChart);
router.get('/users', adminController.getUsers);
router.post('/users/:id/toggle-status', adminController.toggleUserStatus);
router.get('/transactions/pending', adminController.getPendingTransactions);
router.post('/transactions/:id/:decision', adminController.handleTransaction);
router.get('/investments', adminController.getInvestments);
router.get('/broadcasts', adminController.getBroadcasts);
router.post('/broadcasts', adminController.createBroadcast);
router.get('/conversations', adminController.getConversations);
router.get('/chat/history/:id', adminController.getChatHistory);
router.post('/chat/send', adminController.sendChatMessage);

module.exports = router;
