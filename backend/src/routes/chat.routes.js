const router = require('express').Router();
const ctrl = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/chat/history
router.get('/history', authenticate, ctrl.getHistory);

// POST /api/chat/send
router.post('/send', authenticate, ctrl.sendMessage);

// Support conversation routes
router.get('/conversations', authenticate, ctrl.getConversations);
router.post('/conversations', authenticate, ctrl.createConversation);
router.get('/conversations/:id/messages', authenticate, ctrl.getConversationMessages);
router.post('/conversations/:id/read', authenticate, ctrl.markRead);
router.post('/upload', authenticate, upload.single('file'), upload.uploadToCloudinary, ctrl.uploadChatFile);

module.exports = router;
