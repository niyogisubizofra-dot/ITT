const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { User, Transaction, sequelize } = require('../models');

// Process investment & calculate multi-level commissions
router.post('/', auth, async (req, res, next) => {
  const { amount, productId } = req.body;
  if (!amount || isNaN(amount)) {
    return res.status(400).json({ msg: 'Invalid investment amount' });
  }

  const investAmount = parseFloat(amount);
  const t = await sequelize.transaction();

  try {
    const user = await User.findByPk(req.user.id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ msg: 'User not found' });
    }

    // Record the user's investment (negative transaction amount)
    await Transaction.create({
      userId: user.id,
      type: 'investment',
      amount: -investAmount,
      description: `Invested ${investAmount} in ${productId || 'Product'}`
    }, { transaction: t });

    // Multi-level commission distribution
    let currentUser = user;
    const rates = [
      { level: 1, rate: 0.07 }, // 7% commission for Level 1 referrer
      { level: 2, rate: 0.04 }, // 4% commission for Level 2
      { level: 3, rate: 0.02 }  // 2% commission for Level 3
    ];

    for (const r of rates) {
      if (!currentUser.referredBy) break;

      const parent = await User.findByPk(currentUser.referredBy, { transaction: t });
      if (!parent) break;

      const commission = investAmount * r.rate;
      parent.balance = parseFloat(parent.balance || 0) + commission;
      parent.referralEarnings = parseFloat(parent.referralEarnings || 0) + commission;
      await parent.save({ transaction: t });

      await Transaction.create({
        userId: parent.id,
        type: `commission_level_${r.level}`,
        amount: commission,
        description: `Level ${r.level} commission from investment by user ${user.username}`
      }, { transaction: t });

      // Move up the referral chain
      currentUser = parent;
    }

    await t.commit();
    res.json({ msg: 'Investment successful, commissions distributed' });
  } catch (err) {
    if (!t.finished) await t.rollback();
    next(err);
  }
});

// Claim investment profit and log transaction
router.post('/claim', auth, async (req, res, next) => {
  const { amount, productId } = req.body;
  if (!amount || isNaN(amount)) {
    return res.status(400).json({ msg: 'Invalid profit amount' });
  }

  const profit = parseFloat(amount);
  const t = await sequelize.transaction();

  try {
    const user = await User.findByPk(req.user.id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ msg: 'User not found' });
    }

    user.balance = parseFloat(user.balance || 0) + profit;
    await user.save({ transaction: t });

    await Transaction.create({
      userId: user.id,
      type: 'profit_claim',
      amount: profit,
      description: `Claimed daily profit of ${profit} from ${productId || 'Product'}`
    }, { transaction: t });

    await t.commit();
    res.json({ msg: 'Profit claimed successfully', balance: user.balance });
  } catch (err) {
    if (!t.finished) await t.rollback();
    next(err);
  }
});

module.exports = router;
