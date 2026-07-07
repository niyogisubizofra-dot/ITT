const { Op } = require('sequelize');
const { User, Transaction } = require('../models');

// GET /api/referrals/stats
// Returns: referralCode, totalReferrals, levels{1,2,3}, earnings{registrationBonuses,total,level1,level2,level3}, transactions[]
exports.getStats = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Level 1: directly referred by this user
    const level1Users = await User.findAll({ where: { referredBy: user.id } });
    const level1Ids = level1Users.map(u => u.id);

    // Level 2: referred by level 1 users
    const level2Users = level1Ids.length
      ? await User.findAll({ where: { referredBy: { [Op.in]: level1Ids } } })
      : [];
    const level2Ids = level2Users.map(u => u.id);

    // Level 3: referred by level 2 users
    const level3Users = level2Ids.length
      ? await User.findAll({ where: { referredBy: { [Op.in]: level2Ids } } })
      : [];

    // Fetch all referral/commission transactions for this user
    // Only query types that exist in the DB ENUM
    const transactions = await Transaction.findAll({
      where: {
        userId: user.id,
        type: { [Op.in]: ['referral_bonus', 'commission', 'profit', 'investment'] },
      },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    // Calculate earnings by type
    const level1Earnings = transactions
      .filter(t => t.description?.includes('level1') || t.description?.includes('Level 1'))
      .reduce((s, t) => s + parseFloat(t.amount), 0);

    const level2Earnings = transactions
      .filter(t => t.description?.includes('level2') || t.description?.includes('Level 2'))
      .reduce((s, t) => s + parseFloat(t.amount), 0);

    const level3Earnings = transactions
      .filter(t => t.description?.includes('level3') || t.description?.includes('Level 3'))
      .reduce((s, t) => s + parseFloat(t.amount), 0);

    const registrationBonuses = transactions
      .filter(t => t.type === 'referral_bonus')
      .reduce((s, t) => s + parseFloat(t.amount), 0);

    const totalEarnings = transactions.reduce((s, t) => s + parseFloat(t.amount), 0);

    // Format transactions for frontend
    const formattedTx = transactions.map(t => ({
      id: t.id,
      date: t.createdAt,
      type: t.type,
      amount: t.amount,
      description: t.description || t.type,
    }));

    res.json({
      referralCode: user.referralCode,
      totalReferrals: level1Users.length + level2Users.length + level3Users.length,
      levels: {
        1: level1Users.length,
        2: level2Users.length,
        3: level3Users.length,
      },
      earnings: {
        registrationBonuses: parseFloat(registrationBonuses.toFixed(2)),
        total: parseFloat(totalEarnings.toFixed(2)),
        level1: parseFloat(level1Earnings.toFixed(2)),
        level2: parseFloat(level2Earnings.toFixed(2)),
        level3: parseFloat(level3Earnings.toFixed(2)),
      },
      transactions: formattedTx,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/referrals/bonus  — internal: award referral bonus when new user registers
// Called from auth.controller after registration
exports.awardReferralBonus = async (referrerId, newUserId) => {
  try {
    const REGISTRATION_BONUS = 0.10;
    const NEW_USER_BONUS = 0.05;

    // Award referrer
    const referrer = await User.findByPk(referrerId);
    if (referrer) {
      await referrer.update({ balance: parseFloat(referrer.balance) + REGISTRATION_BONUS });
      await Transaction.create({
        userId: referrerId,
        type: 'referral_bonus',
        amount: REGISTRATION_BONUS,
        status: 'completed',
        description: `Referral bonus for inviting user #${newUserId}`,
        reference: `REF-${Date.now()}-${referrerId}`,
      });
    }

    // Award new user welcome bonus
    const newUser = await User.findByPk(newUserId);
    if (newUser) {
      await newUser.update({ balance: parseFloat(newUser.balance) + NEW_USER_BONUS });
      await Transaction.create({
        userId: newUserId,
        type: 'referral_bonus',
        amount: NEW_USER_BONUS,
        status: 'completed',
        description: 'Welcome bonus for joining via referral',
        reference: `WEL-${Date.now()}-${newUserId}`,
      });
    }
  } catch (err) {
    console.error('Referral bonus error:', err.message);
  }
};
