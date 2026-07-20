const { User, Transaction, DepositScreenshot, Investment, DailyEarning, BuyTransaction, SellTransaction, TradingTransfer } = require('../models');
const { generateReference } = require('../utils/helpers');
const { sendTransactionNotification } = require('../services/email.service');
const { createNotification } = require('../services/notification.service');
const { Op } = require('sequelize');

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
        createdAt: { [Op.gte]: today },
      },
    });
    if (existingToday) {
      return res.status(400).json({ error: 'Only one withdrawal per day is allowed' });
    }

    const reference = generateReference('WDR');

    // Create pending withdrawal transaction
    const tx = await Transaction.create({
      userId: user.id,
      type: 'withdrawal',
      amount: withdrawAmount,
      status: 'pending',
      method,
      description: `Withdrawal to ${address}`,
      reference,
      metadata: { address },
    });

    // Notify via notification service & email
    await createNotification({
      userId: user.id,
      title: 'Withdrawal Submitted',
      message: `Your withdrawal request of $${withdrawAmount.toFixed(2)} USDT (Ref: ${reference}) has been submitted and is awaiting approval.`,
      type: 'info',
    }).catch(() => {});

    sendTransactionNotification(user.email, 'withdrawal', withdrawAmount, 'pending').catch(() => {});

    res.status(201).json({
      msg: 'Withdrawal request submitted successfully.',
      transaction: {
        id: tx.id,
        transactionId: reference,
        reference,
        amount: withdrawAmount,
        method,
        status: 'pending',
        date: tx.createdAt,
        currentWalletBalance: balance,
        address,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/deposit/notify  — user notifies admin after manual crypto deposit
exports.notifyDeposit = async (req, res, next) => {
  try {
    const { amount, method = 'BEP20-USDT', screenshotPath, vipPlan } = req.body;
    const depositAmount = parseFloat(amount) || 0;

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const reference = generateReference('DEP');

    const tx = await Transaction.create({
      userId: user.id,
      type: 'deposit',
      amount: depositAmount,
      status: 'pending',
      method,
      description: vipPlan ? `Manual deposit for ${vipPlan}` : 'Manual crypto deposit — awaiting admin verification',
      reference,
      vipPlan: vipPlan || null,
      screenshotPath: screenshotPath || null,
      metadata: { screenshotPath: screenshotPath || null, vipPlan: vipPlan || null },
    });

    if (screenshotPath) {
      const path = require('path');
      const filename = path.basename(screenshotPath);
      await DepositScreenshot.update(
        { transactionId: tx.id },
        { where: { filename, userId: user.id } }
      );
    }

    // Create notification
    await createNotification({
      userId: user.id,
      title: 'Deposit Submitted',
      message: `Your deposit notification of $${depositAmount.toFixed(2)} USDT (Ref: ${reference}) has been submitted and is awaiting admin verification.`,
      type: 'info',
    }).catch(() => {});

    // Emit to admin dashboard
    try {
      const { emitDashboardUpdate } = require('../sockets');
      emitDashboardUpdate('newDeposit', { userId: user.id, username: user.username, amount: depositAmount });
    } catch (e) {}

    res.status(201).json({
      msg: 'Deposit notification sent. Admin will verify and credit your account.',
      transactionId: tx.id,
      reference,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/transaction/:id — secure detail endpoint for deposit & withdrawal confirmation pages
exports.getTransactionById = async (req, res, next) => {
  try {
    const tx = await Transaction.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['id', 'username', 'email', 'balance'] }],
    });

    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    // Multi-tenant data isolation security check
    if (req.user.role !== 'Admin' && tx.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to transaction details' });
    }

    res.json({
      id: tx.id,
      transactionId: tx.reference || 'TX-' + tx.id,
      reference: tx.reference || 'TX-' + tx.id,
      type: tx.type,
      amount: parseFloat(tx.amount) || 0,
      method: tx.method || 'Crypto',
      status: tx.status,
      date: tx.createdAt,
      processedAt: tx.processedAt,
      vipPlan: tx.vipPlan || tx.metadata?.vipPlan || null,
      adminNotes: tx.adminNotes || null,
      user: tx.User?.username,
      email: tx.User?.email,
      walletBalance: parseFloat(tx.User?.balance || 0),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/deposit/history
exports.getMyDeposits = async (req, res, next) => {
  try {
    const { search, status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const where = {
      userId: req.user.id,
      type: 'deposit',
    };

    if (status && status !== 'all') {
      where.status = status.toLowerCase();
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    if (search) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { reference: { [Op.like]: q } },
        { method: { [Op.like]: q } },
        { description: { [Op.like]: q } },
        { vipPlan: { [Op.like]: q } },
        { adminNotes: { [Op.like]: q } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      include: [
        { model: DepositScreenshot, as: 'depositScreenshot', attributes: ['id', 'filename', 'path'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
    });

    const formatted = rows.map((t) => ({
      id: t.id,
      transactionId: t.reference || `DEP-${t.id}`,
      reference: t.reference,
      amount: parseFloat(t.amount),
      method: t.method || 'BEP20-USDT',
      date: t.createdAt,
      status: t.status,
      screenshotUploaded: Boolean(t.screenshotPath || t.depositScreenshot?.path),
      screenshotPath: t.screenshotPath || t.depositScreenshot?.path || null,
      vipPlan: t.vipPlan || (t.metadata?.vipPlan) || null,
      adminNotes: t.adminNotes || null,
    }));

    res.json({
      deposits: formatted,
      total: count,
      page: pageNum,
      totalPages: Math.ceil(count / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/withdraw/history
exports.getMyWithdrawals = async (req, res, next) => {
  try {
    const { search, status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const where = {
      userId: req.user.id,
      type: 'withdrawal',
    };

    if (status && status !== 'all') {
      where.status = status.toLowerCase();
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    if (search) {
      where[Op.or] = [
        { reference: { [Op.iLike]: `%${search}%` } },
        { method: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { adminNotes: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
    });

    const formatted = rows.map((t) => ({
      id: t.id,
      transactionId: t.reference || `WDR-${t.id}`,
      reference: t.reference,
      amount: parseFloat(t.amount),
      method: t.method || 'BEP20-USDT',
      date: t.createdAt,
      status: t.status,
      completedDate: t.processedAt || (t.status === 'completed' || t.status === 'approved' ? t.updatedAt : null),
      adminNotes: t.adminNotes || null,
      address: t.metadata?.address || null,
    }));

    res.json({
      withdrawals: formatted,
      total: count,
      page: pageNum,
      totalPages: Math.ceil(count / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/account-activity
exports.getAccountActivity = async (req, res, next) => {
  try {
    const { category, search, startDate, endDate, page = 1, limit = 15 } = req.query;
    const userId = req.user.id;

    // Fetch transactions
    const txWhere = { userId };
    if (startDate || endDate) {
      txWhere.createdAt = {};
      if (startDate) txWhere.createdAt[Op.gte] = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        txWhere.createdAt[Op.lte] = end;
      }
    }

    const transactions = await Transaction.findAll({
      where: txWhere,
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    const items = [];

    // Map transactions
    transactions.forEach((t) => {
      let cat = 'general';
      let title = t.description || t.type;

      if (t.type === 'deposit') {
        cat = 'deposit';
        title = `Deposit (${t.method || 'Crypto'})`;
      } else if (t.type === 'withdrawal') {
        cat = 'withdrawal';
        title = `Withdrawal (${t.method || 'Crypto'})`;
      } else if (t.type === 'investment') {
        cat = 'investment';
        title = `Investment (${t.description || 'VIP Plan'})`;
      } else if (t.type === 'profit') {
        cat = 'earnings';
        title = `Daily Return (${t.description || 'VIP Earnings'})`;
      } else if (t.type === 'referral_bonus' || t.type === 'reward') {
        cat = 'rewards';
        title = `Reward / Bonus (${t.description || 'Bonus'})`;
      } else if (t.type === 'transfer') {
        cat = 'transfers';
        title = `Wallet Transfer`;
      } else if (t.type === 'buy' || t.type === 'sell') {
        cat = 'trades';
        title = `${t.type.toUpperCase()} Trade`;
      }

      items.push({
        id: `tx-${t.id}`,
        rawId: t.id,
        category: cat,
        type: t.type,
        title,
        description: t.description || `Transaction ref: ${t.reference || t.id}`,
        amount: parseFloat(t.amount),
        status: t.status,
        date: t.createdAt,
        reference: t.reference || `REF-${t.id}`,
        metadata: t.metadata || {},
      });
    });

    // Optionally include Investments if not covered by transactions
    const investments = await Investment.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    investments.forEach((inv) => {
      // Check if investment start is already listed
      const exists = items.some(i => i.type === 'investment' && Math.abs(new Date(i.date) - new Date(inv.createdAt)) < 5000);
      if (!exists) {
        items.push({
          id: `inv-${inv.id}`,
          rawId: inv.id,
          category: 'investment',
          type: 'investment_start',
          title: `Investment Started: ${inv.plan}`,
          description: `Started ${inv.plan} with $${parseFloat(inv.amount).toFixed(2)} for ${inv.durationDays} days.`,
          amount: parseFloat(inv.amount),
          status: inv.status,
          date: inv.startDate || inv.createdAt,
          reference: `INV-${inv.id}`,
          metadata: { dailyProfit: inv.dailyProfit, remainingDays: inv.remainingDays },
        });
      }

      if (inv.status === 'Completed') {
        items.push({
          id: `inv-comp-${inv.id}`,
          rawId: inv.id,
          category: 'investment',
          type: 'investment_completed',
          title: `Investment Completed: ${inv.plan}`,
          description: `${inv.plan} completed all ${inv.durationDays} days! Total return accumulated: $${parseFloat(inv.totalProfit).toFixed(2)}.`,
          amount: parseFloat(inv.totalProfit),
          status: 'Completed',
          date: inv.updatedAt,
          reference: `INV-DONE-${inv.id}`,
          metadata: { durationDays: inv.durationDays },
        });
      }
    });

    // Filter by category if requested
    let filtered = items;
    if (category && category !== 'all') {
      filtered = filtered.filter(item => item.category === category || item.type === category);
    }

    // Search filter
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.reference.toLowerCase().includes(query)
      );
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Paginate
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const total = filtered.length;
    const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      activities: paginated,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

