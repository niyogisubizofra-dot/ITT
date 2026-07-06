const { User, Transaction, Message, Investment } = require('../models');
const { Op } = require('sequelize');

exports.getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.count();
    const activeInvestments = await Investment?.count?.({ where: { status: 'active' } }) || 0;
    const totalDeposits = await Transaction.sum('amount', { where: { type: 'deposit' } }) || 0;
    const totalWithdrawals = await Transaction.sum('amount', { where: { type: 'withdrawal' } }) || 0;
    const balanceResult = await User.sum('balance') || 0;

    res.json({
      stats: {
        totalUsers,
        totalDeposits: parseFloat(totalDeposits),
        totalWithdrawals: parseFloat(totalWithdrawals),
        platformBalance: parseFloat(balanceResult),
        activeInvestments
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getRevenueChart = async (req, res, next) => {
  try {
    const deposits = await Transaction.findAll({
      where: { type: 'deposit' },
      order: [['createdAt', 'ASC']],
      limit: 7
    });
    const withdrawals = await Transaction.findAll({
      where: { type: 'withdrawal' },
      order: [['createdAt', 'ASC']],
      limit: 7
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    const chart = Array.from({ length: 7 }, (_, i) => ({
      name: dayNames[(today - 6 + i + 7) % 7],
      deposits: 0,
      withdrawals: 0
    }));

    deposits.forEach(tx => {
      const day = new Date(tx.createdAt).getDay();
      const idx = (day - today + 7) % 7;
      if (idx >= 0 && idx < 7) chart[idx].deposits += parseFloat(tx.amount || 0);
    });

    withdrawals.forEach(tx => {
      const day = new Date(tx.createdAt).getDay();
      const idx = (day - today + 7) % 7;
      if (idx >= 0 && idx < 7) chart[idx].withdrawals += parseFloat(tx.amount || 0);
    });

    res.json({ chart });
  } catch (err) {
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'refreshToken', 'twoFASecret', 'twoFASecretTemp'] }
    });
    const mapped = users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      balance: parseFloat(u.balance || 0),
      status: u.role === 'Client' ? 'active' : 'active',
      joined: u.createdAt ? u.createdAt.toISOString().split('T')[0] : 'Unknown',
      investments: 0,
      role: u.role
    }));
    res.json(mapped);
  } catch (err) {
    next(err);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    const newRole = user.role === 'Client' ? 'Staff' : 'Client';
    user.role = newRole;
    await user.save();
    res.json({ msg: 'User status updated', role: newRole });
  } catch (err) {
    next(err);
  }
};

exports.getPendingTransactions = async (req, res, next) => {
  try {
    const txs = await Transaction.findAll({
      where: { type: { [Op.in]: ['deposit', 'withdrawal'] } },
      order: [['createdAt', 'DESC']],
      limit: 50,
      include: [{ model: User, as: 'user', attributes: ['username'] }]
    });
    const mapped = txs.map(t => ({
      id: t.id,
      user: t.user?.username || 'Unknown',
      type: t.type,
      amount: parseFloat(t.amount || 0),
      method: t.description || 'Transfer',
      date: t.createdAt
    }));
    res.json(mapped);
  } catch (err) {
    next(err);
  }
};

exports.handleTransaction = async (req, res, next) => {
  try {
    const tx = await Transaction.findByPk(req.params.id);
    if (!tx) return res.status(404).json({ msg: 'Transaction not found' });
    if (req.params.decision === 'approve') {
      tx.description = tx.description ? `${tx.description} (approved)` : 'approved';
    } else {
      tx.description = tx.description ? `${tx.description} (rejected)` : 'rejected';
    }
    await tx.save();
    res.json({ msg: `Transaction ${req.params.decision}d` });
  } catch (err) {
    next(err);
  }
};

exports.getInvestments = async (req, res, next) => {
  try {
    const investments = await Investment?.findAll?.() || [];
    const mapped = investments.map(inv => ({
      id: inv.id,
      user: inv.userId || 'Unknown',
      plan: inv.plan || 'Standard',
      invested: parseFloat(inv.amount || 0),
      dailyProfit: parseFloat(inv.dailyProfit || 0),
      status: inv.status || 'active'
    }));
    res.json(mapped);
  } catch (err) {
    res.json([]);
  }
};

exports.getBroadcasts = async (req, res, next) => {
  try {
    const { Announcement } = require('../models');
    const announcements = await Announcement.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    const mapped = announcements.map(a => ({
      id: a.id,
      message: a.content || a.title || '',
      date: a.createdAt
    }));
    res.json(mapped);
  } catch (err) {
    res.json([]);
  }
};

exports.createBroadcast = async (req, res, next) => {
  try {
    const { Announcement } = require('../models');
    const announcement = await Announcement.create({
      title: 'Broadcast',
      content: req.body.message,
      createdById: req.user.id
    });
    res.json({ msg: 'Broadcast sent', id: announcement.id });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to create broadcast' });
  }
};

exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'sender', attributes: ['username'] },
        { model: User, as: 'receiver', attributes: ['username'] }
      ]
    });

    const convMap = new Map();
    messages.forEach(msg => {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const otherName = msg.senderId === userId
        ? (msg.receiver?.username || `User ${msg.receiverId}`)
        : (msg.sender?.username || `User ${msg.senderId}`);
      if (!convMap.has(otherId) || new Date(msg.createdAt) > new Date(convMap.get(otherId).time)) {
        convMap.set(otherId, {
          userId: otherId,
          username: otherName,
          lastMessage: msg.text || 'Attachment',
          unread: 0,
          time: msg.createdAt
        });
      }
    });

    res.json(Array.from(convMap.values()));
  } catch (err) {
    res.json([]);
  }
};

exports.getChatHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const otherId = req.params.id;
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId, receiverId: otherId },
          { senderId: otherId, receiverId: userId }
        ]
      },
      order: [['createdAt', 'ASC']]
    });
    res.json(messages);
  } catch (err) {
    res.json([]);
  }
};

exports.sendChatMessage = async (req, res, next) => {
  try {
    const { receiverId, text, image } = req.body;
    const sender = await User.findByPk(req.user.id, { attributes: ['username'] });
    const message = await Message.create({
      senderId: req.user.id,
      senderName: sender?.username || 'Admin',
      receiverId,
      text: text || '',
      image: image || null
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiverId}`).emit('receiveChatMessage', message);
      io.to(`user_${req.user.id}`).emit('receiveChatMessage', message);
    }

    res.json(message);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to send message' });
  }
};
