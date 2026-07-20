const { Op } = require('sequelize');
const { User, Transaction, Investment, sequelize } = require('../models');
const { paginate, paginatedResponse } = require('../utils/pagination');
const { emitDashboardUpdate } = require('../sockets');

exports.getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalDeposits, totalWithdrawals, activeInvestments, platformBalance] = await Promise.all([
      User.count({ where: { role: 'Client' } }),
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
    const { search, status } = req.query;
    const limit = Math.min(200, parseInt(req.query.limit) || 200);
    const offset = parseInt(req.query.offset) || 0;

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

    // Optimize: query investment counts for all users in one query using GROUP BY userId
    const investmentCounts = await Investment.findAll({
      attributes: [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        userId: { [Op.in]: rows.map(u => u.id) }
      },
      group: ['userId'],
      raw: true
    });

    const investmentCountMap = investmentCounts.reduce((map, item) => {
      map[item.userId] = parseInt(item.count) || 0;
      return map;
    }, {});

    const usersWithInvestments = rows.map((u) => {
      const raw = u.toJSON();
      return {
        ...raw,
        balance: parseFloat(raw.balance) || 0,
        joined: raw.createdAt,
        investments: investmentCountMap[u.id] || 0,
      };
    });

    // Always return a plain array so frontend can safely use .length
    res.json(usersWithInvestments);
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

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete yourself.' });
    }

    await user.destroy();
    res.json({ msg: 'User deleted successfully' });
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

exports.getDepositVerifications = async (req, res, next) => {
  try {
    const { status = 'pending', search, page = 1, limit = 50 } = req.query;
    const { DepositScreenshot } = require('../models');

    const where = { type: 'deposit' };
    if (status && status !== 'all') {
      where.status = status.toLowerCase();
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { reference: { [Op.like]: q } },
        { method: { [Op.like]: q } },
        { vipPlan: { [Op.like]: q } },
        { description: { [Op.like]: q } },
        { '$User.username$': { [Op.like]: q } },
        { '$User.email$': { [Op.like]: q } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 50);

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['id', 'username', 'email'], required: false },
        { model: DepositScreenshot, as: 'depositScreenshot', required: false, attributes: ['id', 'filename', 'path', 'size', 'hash'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
      subQuery: false,
    });

    const formatted = rows.map((t) => ({
      id: t.id,
      userId: t.userId,
      user: t.User?.username || 'User #' + t.userId,
      email: t.User?.email || '',
      amount: parseFloat(t.amount) || 0,
      method: t.method || 'Crypto',
      status: t.status,
      date: t.createdAt,
      reference: t.reference || 'DEP-' + t.id,
      vipPlan: t.vipPlan || t.metadata?.vipPlan || null,
      adminNotes: t.adminNotes || null,
      screenshotPath: t.screenshotPath || t.depositScreenshot?.path || null,
      screenshotFilename: t.depositScreenshot?.filename || (t.screenshotPath ? require('path').basename(t.screenshotPath) : null),
      processedAt: t.processedAt,
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

exports.approveTransaction = async (req, res, next) => {
  try {
    const { createNotification } = require('../services/notification.service');
    const { VipPlan } = require('../models');

    const tx = await Transaction.findByPk(req.params.id, {
      include: [{ model: User }],
    });
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    if (tx.status !== 'pending') return res.status(400).json({ error: 'Transaction already processed' });

    const adminNotes = req.body.adminNotes || 'Approved by admin';

    await tx.update({
      status: 'approved',
      processedBy: req.user.id,
      processedAt: new Date(),
      adminNotes,
    });

    const user = tx.User;
    if (tx.type === 'deposit') {
      // 1. Credit balance
      const newBalance = parseFloat(user.balance) + parseFloat(tx.amount);
      await user.update({ balance: newBalance });

      // Notify deposit approval with direct link to deposit success confirmation page
      await createNotification({
        userId: user.id,
        title: 'Deposit Approved',
        message: `Your deposit of $${parseFloat(tx.amount).toFixed(2)} USDT (Ref: ${tx.reference || tx.id}) has been successfully confirmed and credited to your wallet. Click to view confirmation.`,
        type: 'success',
        link: `/deposit-success/${tx.id}`,
      }).catch(() => {});

      // 2. Activate VIP plan automatically if specified
      const planName = tx.vipPlan || tx.metadata?.vipPlan;
      if (planName) {
        const dbPlan = await VipPlan.findByPk(planName).catch(() => null);
        const profitMap = {
          'VIP 1': 0.20,
          'VIP 2': 0.65,
          'VIP 3': 2.50,
          'VVP 1': 8.50,
          'VVP 2': 32.00,
          'VVP 3': 105.00,
          'VVVP 1': 420.00,
        };
        const dailyProfit = dbPlan ? parseFloat(dbPlan.dailyProfit) : (profitMap[planName] || parseFloat((tx.amount * 0.04).toFixed(2)));
        const durationDays = dbPlan ? parseInt(dbPlan.durationDays) || 32 : 32;

        await Investment.create({
          userId: user.id,
          plan: planName,
          amount: tx.amount,
          dailyProfit,
          durationDays,
          remainingDays: durationDays,
          totalExpectedReturn: parseFloat((dailyProfit * durationDays).toFixed(2)),
          status: 'Running',
          startDate: new Date(),
        });

        await createNotification({
          userId: user.id,
          title: 'VIP Activated & Investment Started',
          message: `Your ${planName} plan has been activated! Yielding $${dailyProfit.toFixed(2)} daily for ${durationDays} days.`,
          type: 'success',
          link: `/dashboard?tab=investments`,
        }).catch(() => {});

        try {
          const { emitDashboardUpdate } = require('../sockets');
          emitDashboardUpdate('investmentCreated', { userId: user.id, plan: planName, amount: tx.amount });
        } catch (e) {}
      }
    } else if (tx.type === 'withdrawal') {
      if (parseFloat(user.balance) < parseFloat(tx.amount)) {
        return res.status(400).json({ error: 'Insufficient user balance to process withdrawal' });
      }
      await user.update({ balance: parseFloat(user.balance) - parseFloat(tx.amount) });

      await createNotification({
        userId: user.id,
        title: 'Withdrawal Completed',
        message: `Your withdrawal request of $${parseFloat(tx.amount).toFixed(2)} USDT (Ref: ${tx.reference || tx.id}) has been successfully processed, and funds have been sent to your account. Click to view confirmation.`,
        type: 'success',
        link: `/withdrawal-success/${tx.id}`,
      }).catch(() => {});
    }

    emitDashboardUpdate('transactionApproved', { id: tx.id, type: tx.type, amount: tx.amount });
    res.json({ msg: 'Transaction approved successfully' });
  } catch (err) {
    next(err);
  }
};

exports.rejectTransaction = async (req, res, next) => {
  try {
    const { createNotification } = require('../services/notification.service');
    const tx = await Transaction.findByPk(req.params.id, { include: [{ model: User }] });
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    const adminNotes = req.body.adminNotes || req.body.reason || 'Deposit proof verification failed.';

    await tx.update({
      status: 'rejected',
      processedBy: req.user.id,
      processedAt: new Date(),
      adminNotes,
    });

    if (tx.User) {
      const typeLabel = tx.type === 'deposit' ? 'Deposit' : 'Withdrawal';
      const historyLink = tx.type === 'deposit' ? '/deposit-history' : '/withdrawal-history';
      await createNotification({
        userId: tx.User.id,
        title: `${typeLabel} Rejected`,
        message: `Your ${typeLabel.toLowerCase()} request of $${parseFloat(tx.amount).toFixed(2)} USDT was rejected. Reason: ${adminNotes}`,
        type: 'error',
        link: historyLink,
      }).catch(() => {});
    }

    res.json({ msg: 'Transaction rejected successfully' });
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
    const { Message, SupportConversation } = require('../models');
    const { userId } = req.params;

    // Find latest conversation for this user
    let conv = await SupportConversation.findOne({
      where: { userId },
      order: [['updatedAt', 'DESC']],
    });

    if (!conv) {
      // Create a default conversation so they have one
      conv = await SupportConversation.create({
        userId,
        subject: 'Support Thread',
        status: 'Open',
        assignedAdminId: req.user.id,
      });
    }

    const messages = await Message.findAll({
      where: { conversationId: conv.id },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'avatar', 'role'] },
      ],
      order: [['createdAt', 'ASC']],
      limit: 200,
    });

    res.json(messages);
  } catch (err) {
    next(err);
  }
};

exports.sendChatMessage = async (req, res, next) => {
  try {
    const { Message, SupportConversation, User } = require('../models');
    const { receiverId, text, image, fileUrl, fileName, conversationId } = req.body;
    const senderId = req.user.id;

    if (!text?.trim() && !image && !fileUrl) {
      return res.status(400).json({ error: 'Message text, image, or file required' });
    }

    let activeConvId = conversationId;
    let conv;

    if (activeConvId) {
      conv = await SupportConversation.findByPk(activeConvId);
      if (!conv) return res.status(404).json({ error: 'Conversation not found' });
    } else {
      // Find latest conversation for this user
      conv = await SupportConversation.findOne({
        where: {
          userId: receiverId,
          status: { [Op.in]: ['Open', 'Pending'] },
        },
        order: [['updatedAt', 'DESC']],
      });

      if (!conv) {
        conv = await SupportConversation.create({
          userId: receiverId,
          subject: 'Support Thread',
          status: 'Pending',
          assignedAdminId: senderId,
        });
      }
      activeConvId = conv.id;
    }

    // Set assigned admin if unassigned
    if (!conv.assignedAdminId) {
      await conv.update({ assignedAdminId: senderId });
    }

    const msg = await Message.create({
      senderId,
      receiverId,
      conversationId: activeConvId,
      text: text || null,
      image: image || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
    });

    // Update conversation last message & status to Pending (waiting for user response)
    await conv.update({
      lastMessage: text || (fileUrl ? 'Attachment' : 'Image'),
      lastMessageAt: msg.createdAt,
      status: 'Pending',
    });

    // Emit live Socket.IO update
    try {
      const { getIO } = require('../sockets');
      const io = getIO();
      const sender = await User.findByPk(senderId, { attributes: ['id', 'username', 'avatar'] });
      const payload = {
        id: msg.id,
        senderId,
        receiverId,
        conversationId: activeConvId,
        senderName: sender?.username || req.user.username,
        text: msg.text,
        image: msg.image,
        fileUrl: msg.fileUrl,
        fileName: msg.fileName,
        createdAt: msg.createdAt,
        isRead: msg.isRead,
      };

      io.to(`user_${receiverId}`).emit('receiveChatMessage', payload);
      io.to(`user_${senderId}`).emit('receiveChatMessage', payload);
      io.to('admin_room').emit('receiveChatMessage', payload);

      // Emit list update
      const convPayload = {
        id: conv.id,
        userId: conv.userId,
        assignedAdminId: conv.assignedAdminId,
        status: conv.status,
        subject: conv.subject,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
      };
      io.to(`user_${conv.userId}`).emit('conversationUpdated', convPayload);
      io.to('admin_room').emit('conversationUpdated', convPayload);
    } catch (e) {
      console.error('Socket emit failed:', e.message);
    }

    // Notifications
    try {
      const { createNotification } = require('../services/notification.service');
      const messagePreview = text || (fileUrl ? 'Attachment' : 'Image');
      await createNotification({
        userId: receiverId,
        title: 'Support Agent Replied',
        message: messagePreview,
        type: 'info',
        link: '/dashboard?tab=chat',
      });
    } catch (e) {
      console.error('Notification failed:', e.message);
    }

    res.status(201).json(msg);
  } catch (err) {
    next(err);
  }
};

exports.getConversations = async (req, res, next) => {
  try {
    const { SupportConversation, User, Message } = require('../models');
    const { search, status, assignedAdminId, isArchived } = req.query;

    const where = {};

    // Filter by archived status
    where.isArchived = isArchived === 'true';

    // Filter by status
    if (status && status !== 'all') {
      where.status = status;
    }

    // Filter by assignment
    if (assignedAdminId) {
      if (assignedAdminId === 'unassigned') {
        where.assignedAdminId = null;
      } else if (assignedAdminId === 'me') {
        where.assignedAdminId = req.user.id;
      } else {
        where.assignedAdminId = parseInt(assignedAdminId);
      }
    }

    // Filter by search query (user username, email, subject, or message text)
    const userWhere = {};
    if (search) {
      userWhere[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
      where[Op.or] = [
        { subject: { [Op.iLike]: `%${search}%` } },
        { lastMessage: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Fetch conversations
    const conversations = await SupportConversation.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          where: search ? userWhere : undefined,
          attributes: ['id', 'username', 'email', 'avatar', 'role'],
          required: search ? true : false,
        },
        {
          model: User,
          as: 'assignedAdmin',
          attributes: ['id', 'username', 'avatar'],
        }
      ],
      order: [['updatedAt', 'DESC']],
    });

    // Count unread messages per conversation
    const formatted = await Promise.all(
      conversations.map(async (c) => {
        const unread = await Message.count({
          where: {
            conversationId: c.id,
            senderId: c.userId,
            isRead: false,
          },
        });

        // Resolve user if not included because search filter wasn't applied
        let userVal = c.user;
        if (!userVal) {
          userVal = await User.findByPk(c.userId, {
            attributes: ['id', 'username', 'email', 'avatar', 'role'],
          });
        }

        return {
          id: c.id,
          userId: c.userId,
          username: userVal?.username || `User ${c.userId}`,
          userEmail: userVal?.email,
          userAvatar: userVal?.avatar,
          userRole: userVal?.role,
          assignedAdminId: c.assignedAdminId,
          assignedAdminName: c.assignedAdmin?.username,
          status: c.status,
          subject: c.subject,
          lastMessage: c.lastMessage || '',
          lastMessageAt: c.lastMessageAt || c.updatedAt,
          unread,
          isArchived: c.isArchived,
        };
      })
    );

    res.json(formatted);
  } catch (err) {
    next(err);
  }
};

exports.getConversationMessages = async (req, res, next) => {
  try {
    const { Message, User } = require('../models');
    const { id } = req.params;

    const messages = await Message.findAll({
      where: { conversationId: id },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'avatar', 'role'] },
      ],
      order: [['createdAt', 'ASC']],
    });

    res.json(messages);
  } catch (err) {
    next(err);
  }
};

exports.updateConversationStatus = async (req, res, next) => {
  try {
    const { SupportConversation } = require('../models');
    const { id } = req.params;
    const { status } = req.body;

    const conv = await SupportConversation.findByPk(id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    await conv.update({ status });

    // Emit live update
    try {
      const { getIO } = require('../sockets');
      const io = getIO();
      const payload = { id: conv.id, status: conv.status };
      io.to(`user_${conv.userId}`).emit('ticketStatusChanged', payload);
      io.to('admin_room').emit('ticketStatusChanged', payload);
    } catch (e) {}

    res.json({ msg: 'Status updated', status });
  } catch (err) {
    next(err);
  }
};

exports.assignConversation = async (req, res, next) => {
  try {
    const { SupportConversation, User } = require('../models');
    const { id } = req.params;
    const { assignedAdminId } = req.body;

    const conv = await SupportConversation.findByPk(id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    let adminName = null;
    if (assignedAdminId) {
      const adminUser = await User.findOne({
        where: { id: assignedAdminId, role: 'Admin' },
      });
      if (!adminUser) return res.status(400).json({ error: 'User is not a valid support agent' });
      adminName = adminUser.username;
    }

    await conv.update({ assignedAdminId: assignedAdminId || null });

    // Emit live update
    try {
      const { getIO } = require('../sockets');
      const io = getIO();
      const payload = { id: conv.id, assignedAdminId: conv.assignedAdminId, assignedAdminName: adminName };
      io.to(`user_${conv.userId}`).emit('ticketAssigned', payload);
      io.to('admin_room').emit('ticketAssigned', payload);
    } catch (e) {}

    res.json({ msg: 'Ticket assigned', assignedAdminId, assignedAdminName: adminName });
  } catch (err) {
    next(err);
  }
};

exports.archiveConversation = async (req, res, next) => {
  try {
    const { SupportConversation } = require('../models');
    const { id } = req.params;
    const { isArchived } = req.body;

    const conv = await SupportConversation.findByPk(id);
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    await conv.update({ isArchived: isArchived === true });

    // Emit live update
    try {
      const { getIO } = require('../sockets');
      const io = getIO();
      const payload = { id: conv.id, isArchived: conv.isArchived };
      io.to(`user_${conv.userId}`).emit('ticketArchived', payload);
      io.to('admin_room').emit('ticketArchived', payload);
    } catch (e) {}

    res.json({ msg: 'Ticket archive state updated', isArchived: conv.isArchived });
  } catch (err) {
    next(err);
  }
};

exports.getAdmins = async (req, res, next) => {
  try {
    const { User } = require('../models');
    const admins = await User.findAll({
      where: { role: 'Admin' },
      attributes: ['id', 'username', 'email', 'avatar', 'role'],
      order: [['username', 'ASC']],
    });
    res.json(admins);
  } catch (err) {
    next(err);
  }
};
