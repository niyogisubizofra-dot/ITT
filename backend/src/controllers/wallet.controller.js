const { User, Transaction } = require('../models');
const { generateReference } = require('../utils/helpers');
const { sendTransactionNotification } = require('../services/email.service');

// POST /api/withdraw
exports.requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, address, method = 'BEP20-USDT' } = req.body;
    const withdrawAmount = parseFloat(amount);

    if (!withdrawAmount || withdrawAmount < 1) {
      return res.status(400).json({ error: 'Minimum withdrawal is 1 USDT' });
    }
    if (!address?.trim()) {
      return res.status(400).json({ error: 'Withdrawal address required' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const balance = parseFloat(user.balance);
    if (balance < withdrawAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Check one withdrawal per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingToday = await Transaction.findOne({
      where: {
        userId: user.id,
        type: 'withdrawal',
        createdAt: { [require('sequelize').Op.gte]: today },
      },
    });
    if (existingToday) {
      return res.status(400).json({ error: 'Only one withdrawal per day is allowed' });
    }

    // Create pending withdrawal transaction
    const tx = await Transaction.create({
      userId: user.id,
      type: 'withdrawal',
      amount: withdrawAmount,
      status: 'pending',
      method,
      description: `Withdrawal to ${address}`,
      reference: generateReference('WDR'),
      metadata: { address },
    });

    // Notify via email (non-blocking)
    sendTransactionNotification(user.email, 'withdrawal', withdrawAmount, 'pending').catch(() => {});

    res.status(201).json({
      msg: 'Withdrawal request submitted. Awaiting admin approval.',
      transactionId: tx.id,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/deposit/notify  — user notifies admin after manual crypto deposit
exports.notifyDeposit = async (req, res, next) => {
  try {
    const { amount, method = 'BEP20-USDT', screenshotPath } = req.body;
    const depositAmount = parseFloat(amount) || 0;

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tx = await Transaction.create({
      userId: user.id,
      type: 'deposit',
      amount: depositAmount,
      status: 'pending',
      method,
      description: 'Manual crypto deposit — awaiting admin verification',
      reference: generateReference('DEP'),
      metadata: { screenshotPath: screenshotPath || null },
    });

    // Emit to admin dashboard
    try {
      const { emitDashboardUpdate } = require('../sockets');
      emitDashboardUpdate('newDeposit', { userId: user.id, username: user.username, amount: depositAmount });
    } catch (e) {}

    res.status(201).json({
      msg: 'Deposit notification sent. Admin will verify and credit your account.',
      transactionId: tx.id,
    });
  } catch (err) {
    next(err);
  }
};
