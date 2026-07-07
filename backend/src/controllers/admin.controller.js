const { Op } = require('sequelize');
const { User, Transaction, Investment } = require('../models');
const { paginate, paginatedResponse } = require('../utils/pagination');
const { emitDashboardUpdate } = require('../sockets');

exports.getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalDeposits, totalWithdrawals, activeInvestments, platformBalance] = await Promise.all([
      User.count({ where: { role: 'User' } }),
      Transaction.sum('amount', { where: { type: 'deposit', status: 'approved' } }),
      Transaction.sum('amount', { where: { type: 'withdrawal', status: 'approved' } }),
      Investment.count({ where: { status: 'active' } }),
      User.sum('balance'),
    ]);

    res.json({
      stats: {
        totalUsers: totalUsers || 0,
        totalDeposits: parseFloat(totalDeposits) || 0,
        totalWithdrawals: parseFloat(totalWithdrawals) || 0,
        activeInvestments: activeInvestments || 0,
        platformBalance: parseFloat(platformBalance) || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getRevenueChart = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const chart = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const [deposits, withdrawals] = await Promise.all([
        Transaction.sum('amount', { where: { type: 'deposit', status: 'approved', createdAt: { [Op.between]: [dayStart, dayEnd] } } }),
        Transaction.sum('amount', { where: { type: 'withdrawal', status: 'approved', createdAt: { [Op.between]: [dayStart, dayEnd] } } }),
      ]);

      chart.push({
        name: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        date: dayStart.toISOString().split('T')[0],
        deposits: parseFloat(deposits) || 0,
        withdrawals: parseFloat(withdrawals) || 0,
      });
    }

    res.json({ chart });
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const { search, status } = req.query;

    const where = {};
    if (status && status !== 'all') where.status = status;
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'twoFactorSecret', 'resetPasswordToken'] },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    // Attach investment count
    const usersWithInvestments = await Promise.all(
      rows.map(async (u) => {
        const investments = await Investment.count({ where: { userId: u.id } });
        return { ...u.toJSON(), investments };
      })
    );

    res.json(paginatedResponse(usersWithInvestments, count, page, limit).data.length
      ? paginatedResponse(usersWithInvestments, count, page, limit)
      : usersWithInvestments
    );
  } catch (err) {
    next(err);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    await user.update({ status: newStatus });

    res.json({ msg: `User ${newStatus}`, status: newStatus });
  } catch (err) {
    next(err);
  }
};

exports.getPendingTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.findAll({
      where: { status: 'pending' },
      include: [{ model: require('../models').User, attributes: ['id', 'username', 'email'] }],
      order: [['createdAt', 'DESC']],
    });

    const formatted = transactions.map((t) => ({
      id: t.id,
      user: t.User?.username,
      email: t.User?.email,
      type: t.type,
      amount: parseFloat(t.amount),
      method: t.method,
      date: t.createdAt,
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
};

exports.approveTransaction = async (req, res, next) => {
  try {
    const tx = await Transaction.findByPk(req.params.id, {
      include: [{ model: require('../models').User }],
    });
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    if (tx.status !== 'pending') return res.status(400).json({ error: 'Transaction already processed' });

    await tx.update({ status: 'approved', processedBy: req.user.id, processedAt: new Date() });

    // Update user balance
    const user = tx.User;
    if (tx.type === 'deposit') {
      await user.update({ balance: parseFloat(user.balance) + parseFloat(tx.amount) });
    } else if (tx.type === 'withdrawal') {
      if (parseFloat(user.balance) < parseFloat(tx.amount)) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
      await user.update({ balance: parseFloat(user.balance) - parseFloat(tx.amount) });
    }

    emitDashboardUpdate('transactionApproved', { id: tx.id, type: tx.type, amount: tx.amount });
    res.json({ msg: 'Transaction approved' });
  } catch (err) {
    next(err);
  }
};

exports.rejectTransaction = async (req, res, next) => {
  try {
    const tx = await Transaction.findByPk(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    await tx.update({ status: 'rejected', processedBy: req.user.id, processedAt: new Date() });
    res.json({ msg: 'Transaction rejected' });
  } catch (err) {
    next(err);
  }
};

exports.getInvestments = async (req, res, next) => {
  try {
    const investments = await Investment.findAll({
      include: [{ model: require('../models').User, attributes: ['id', 'username', 'email'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json(investments.map((inv) => ({
      id: inv.id,
      user: inv.User?.username,
      plan: inv.plan,
      invested: parseFloat(inv.amount),
      dailyProfit: parseFloat(inv.dailyProfit),
      status: inv.status,
    })));
  } catch (err) {
    next(err);
  }
};

exports.getBroadcasts = async (req, res, next) => {
  try {
    const { Announcement } = require('../models');
    const broadcasts = await Announcement.findAll({ order: [['createdAt', 'DESC']], limit: 50 });
    res.json(broadcasts);
  } catch (err) {
    next(err);
  }
};

exports.createBroadcast = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message required' });

    const { Announcement } = require('../models');
    const broadcast = await Announcement.create({
      title: 'Broadcast',
      message,
      createdBy: req.user.id,
      targetRole: 'all',
    });

    // Emit to all connected clients
    const { getIO } = require('../sockets');
    try { getIO().emit('broadcast', broadcast); } catch (e) {}

    res.status(201).json(broadcast);
  } catch (err) {
    next(err);
  }
};

exports.getChatHistory = async (req, res, next) => {
  try {
    const { Message } = require('../models');
    const { userId } = req.params;

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: req.user.id, receiverId: userId },
          { senderId: userId, receiverId: req.user.id },
        ],
      },
      order: [['createdAt', 'ASC']],
      limit: 100,
    });

    res.json(messages);
  } catch (err) {
    next(err);
  }
};

exports.sendChatMessage = async (req, res, next) => {
  try {
    const { Message } = require('../models');
    const { receiverId, text, image } = req.body;

    const msg = await Message.create({ senderId: req.user.id, receiverId, text, image });
    res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
};

exports.getConversations = async (req, res, next) => {
  try {
    const { Message, User } = require('../models');
    const { sequelize } = require('../models');

    // Get distinct users who have messaged admin
    const messages = await Message.findAll({
      where: {
        [Op.or]: [{ senderId: req.user.id }, { receiverId: req.user.id }],
      },
      order: [['createdAt', 'DESC']],
    });

    const userMap = new Map();
    for (const msg of messages) {
      const otherId = msg.senderId === req.user.id ? msg.receiverId : msg.senderId;
      if (!userMap.has(otherId)) {
        userMap.set(otherId, msg);
      }
    }

    const conversations = await Promise.all(
      Array.from(userMap.entries()).map(async ([userId, lastMsg]) => {
        const user = await User.findByPk(userId, { attributes: ['id', 'username', 'avatar'] });
        const unread = await Message.count({ where: { senderId: userId, receiverId: req.user.id, isRead: false } });
        return {
          userId,
          username: user?.username || `User ${userId}`,
          lastMessage: lastMsg.text || 'Attachment',
          unread,
          time: lastMsg.createdAt,
        };
      })
    );

    res.json(conversations);
  } catch (err) {
    next(err);
  }
};
