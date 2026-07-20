const { Op } = require('sequelize');
const { User, Transaction, Investment, sequelize } = require('../models');
const { generateReference } = require('../utils/helpers');

// POST /api/invest  — deduct balance, create investment + transaction
exports.createInvestment = async (req, res, next) => {
  try {
    const { amount, productId } = req.body;
    const investAmount = parseFloat(amount);

    if (!investAmount || investAmount <= 0) {
      return res.status(400).json({ error: 'Invalid investment amount' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const balance = parseFloat(user.balance);
    if (balance < investAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct balance
    await user.update({ balance: balance - investAmount });

    // Daily profit map (matches frontend products)
    const profitMap = {
      'VIP 1':   0.20,
      'VIP 2':   0.65,
      'VIP 3':   2.50,
      'VVP 1':   8.50,
      'VVP 2':  32.00,
      'VVP 3': 105.00,
      'VVVP 1':420.00,
    };
    const dailyProfit = profitMap[productId] || parseFloat((investAmount * 0.04).toFixed(2));

    // Create investment record
    const investment = await Investment.create({
      userId: user.id,
      plan: productId || 'Custom',
      amount: investAmount,
      dailyProfit,
      status: 'active',
    });

    // Log transaction
    await Transaction.create({
      userId: user.id,
      type: 'investment',
      amount: investAmount,
      status: 'completed',
      description: `Investment in ${productId}`,
      reference: generateReference('INV'),
    });

    res.json({
      msg: 'Investment created',
      balance: parseFloat(user.balance) - investAmount,
      investment,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/invest/claim  — add profit to balance
exports.claimProfit = async (req, res, next) => {
  try {
    const { amount, productId } = req.body;
    const profitAmount = parseFloat(amount);

    if (!profitAmount || profitAmount <= 0) {
      return res.status(400).json({ error: 'Invalid profit amount' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newBalance = parseFloat(user.balance) + profitAmount;
    await user.update({ balance: newBalance });

    // Log profit transaction
    await Transaction.create({
      userId: user.id,
      type: 'profit',
      amount: profitAmount,
      status: 'completed',
      description: `Daily profit from ${productId}`,
      reference: generateReference('PRF'),
    });

    // Update investment record if found
    await Investment.update(
      { totalProfit: sequelize.literal(`"totalProfit" + ${profitAmount}`), lastProfitAt: new Date() },
      { where: { userId: user.id, plan: productId, status: 'active' } }
    ).catch(() => {});

    res.json({ msg: 'Profit claimed successfully', balance: newBalance });
  } catch (err) {
    next(err);
  }
};

// GET /api/invest/my-investments
exports.getMyInvestments = async (req, res, next) => {
  try {
    const investments = await Investment.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json({ investments });
  } catch (err) {
    next(err);
  }
};
