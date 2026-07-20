const router = require('express').Router();
const ctrl = require('../controllers/referral.controller');
const { authenticate } = require('../middleware/auth');

// GET /api/referrals/stats
router.get('/stats', authenticate, ctrl.getStats);

module.exports = router;
