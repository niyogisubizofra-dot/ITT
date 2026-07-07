const router = require('express').Router();
const ctrl = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');

// GET /api/chat/history
router.get('/history', authenticate, ctrl.getHistory);

// POST /api/chat/send
router.post('/send', authenticate, ctrl.sendMessage);

module.exports = router;
