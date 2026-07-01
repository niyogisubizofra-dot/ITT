const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { User, Transaction } = require('../models');

// Get referral stats for the dashboard
router.get('/stats', auth, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Get Level 1 referrals
    const level1 = await User.findAll({ where: { referredBy: user.id } });
    const level1Ids = level1.map(u => u.id);

    // Get Level 2 referrals
    let level2 = [];
    let level2Ids = [];
    if (level1Ids.length > 0) {
      level2 = await User.findAll({ where: { referredBy: level1Ids } });
      level2Ids = level2.map(u => u.id);
    }

    // Get Level 3 referrals
    let level3 = [];
    if (level2Ids.length > 0) {
      level3 = await User.findAll({ where: { referredBy: level2Ids } });
    }

    // Transactions log
    const transactions = await Transaction.findAll({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']]
    });

    const referralBonuses = transactions
      .filter(t => t.type === 'referral_bonus')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const level1Commissions = transactions
      .filter(t => t.type === 'commission_level_1')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const level2Commissions = transactions
      .filter(t => t.type === 'commission_level_2')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const level3Commissions = transactions
      .filter(t => t.type === 'commission_level_3')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    res.json({
      referralCode: user.referralCode,
      totalReferrals: level1.length + level2.length + level3.length,
      levels: {
        1: level1.length,
        2: level2.length,
        3: level3.length
      },
      earnings: {
        registrationBonuses: referralBonuses,
        level1: level1Commissions,
        level2: level2Commissions,
        level3: level3Commissions,
        total: parseFloat(user.referralEarnings || 0)
      },
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        date: t.createdAt
      }))
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
