const { Op } = require('sequelize');
const { Message, User, SupportConversation } = require('../models');

// GET /api/chat/history  — user's own chat history with support (admin) [Legacy compatibility]
exports.getHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find the active support conversation or latest
    const conv = await SupportConversation.findOne({
      where: { userId },
      order: [['updatedAt', 'DESC']],
    });

    if (!conv) {
      // Backward compatible fall back: find messages directly
      const adminUser = await User.findOne({
        where: { role: 'Admin' },
        order: [['id', 'ASC']],
      });
      const adminId = adminUser?.id || 1;

      const messages = await Message.findAll({
        where: {
          [Op.or]: [
            { senderId: userId, receiverId: adminId },
            { senderId: adminId, receiverId: userId },
          ],
        },
        include: [
          { model: User, as: 'sender', attributes: ['id', 'username', 'avatar'] },
        ],
        order: [['createdAt', 'ASC']],
        limit: 200,
      });

      const formatted = messages.map(m => ({
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        senderName: m.sender?.username || 'Support Agent',
        text: m.text,
        image: m.image,
        fileUrl: m.fileUrl,
        fileName: m.fileName,
        createdAt: m.createdAt,
        isRead: m.isRead,
      }));

      return res.json(formatted);
    }

    const messages = await Message.findAll({
      where: { conversationId: conv.id },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'avatar'] },
      ],
      order: [['createdAt', 'ASC']],
      limit: 200,
    });

    const formatted = messages.map(m => ({
      id: m.id,
      senderId: m.senderId,
      receiverId: m.receiverId,
      conversationId: m.conversationId,
      senderName: m.sender?.username || (m.senderId === userId ? req.user.username : 'Support Agent'),
      text: m.text,
      image: m.image,
      fileUrl: m.fileUrl,
      fileName: m.fileName,
      createdAt: m.createdAt,
      isRead: m.isRead,
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
};

// POST /api/chat/send  — user sends message to support [Backward-compatible]
exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, text, image, fileUrl, fileName, conversationId } = req.body;
    const senderId = req.user.id;

    if (!text?.trim() && !image && !fileUrl) {
      return res.status(400).json({ error: 'Message text, image, or file required' });
    }

    let activeConvId = conversationId;
    let conv;

    if (activeConvId) {
      conv = await SupportConversation.findByPk(activeConvId);
      if (!conv) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
    } else {
      // Find or create user's latest open/pending conversation
      conv = await SupportConversation.findOne({
        where: {
          userId: senderId,
          status: { [Op.in]: ['Open', 'Pending'] },
        },
        order: [['updatedAt', 'DESC']],
      });

      if (!conv) {
        conv = await SupportConversation.create({
          userId: senderId,
          subject: 'Support Chat',
          status: 'Open',
        });
      }
      activeConvId = conv.id;
    }

    // Determine receiverId: if sender is the user, receiver is the assigned admin or default admin
    let targetReceiverId = receiverId;
    if (!targetReceiverId) {
      targetReceiverId = conv.assignedAdminId;
    }
    if (!targetReceiverId) {
      const admin = await User.findOne({
        where: { role: 'Admin' },
        order: [['id', 'ASC']],
      });
      targetReceiverId = admin?.id || 1;
    }

    const msg = await Message.create({
      senderId,
      receiverId: targetReceiverId,
      conversationId: activeConvId,
      text: text || null,
      image: image || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
    });

    // Update last message in the SupportConversation
    await conv.update({
      lastMessage: text || (fileUrl ? 'Attachment' : 'Image'),
      lastMessageAt: msg.createdAt,
      status: req.user.role && req.user.role === 'Admin' ? 'Pending' : 'Open',
    });

    // Emit via Socket.IO
    try {
      const { getIO } = require('../sockets');
      const io = getIO();
      const sender = await User.findByPk(senderId, { attributes: ['id', 'username', 'avatar'] });
      const payload = {
        id: msg.id,
        senderId,
        receiverId: targetReceiverId,
        conversationId: activeConvId,
        senderName: sender?.username || req.user.username,
        text: msg.text,
        image: msg.image,
        fileUrl: msg.fileUrl,
        fileName: msg.fileName,
        createdAt: msg.createdAt,
        isRead: msg.isRead,
      };

      // Emit to rooms
      io.to(`user_${targetReceiverId}`).emit('receiveChatMessage', payload);
      io.to(`user_${senderId}`).emit('receiveChatMessage', payload);

      if (!conv.assignedAdminId) {
        io.to('admin_room').emit('receiveChatMessage', payload);
      }

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
      const { createNotification, broadcastNotification } = require('../services/notification.service');
      const isAdmin = req.user.role && req.user.role === 'Admin';
      const messagePreview = text || (fileUrl ? 'Attachment' : 'Image');

      if (isAdmin) {
        await createNotification({
          userId: conv.userId,
          title: 'Support Agent Replied',
          message: messagePreview,
          type: 'info',
          link: '/dashboard?tab=chat',
        });
      } else {
        if (conv.assignedAdminId) {
          await createNotification({
            userId: conv.assignedAdminId,
            title: 'New Support Message',
            message: `${req.user.username}: ${messagePreview}`,
            type: 'info',
            link: '/admin-dashboard?tab=chat',
          });
        } else {
          const admins = await User.findAll({
            where: { role: 'Admin' },
            attributes: ['id'],
          });
          await broadcastNotification({
            title: 'Unassigned Support Ticket Update',
            message: `${req.user.username}: ${messagePreview}`,
            type: 'info',
            userIds: admins.map(a => a.id),
          });
        }
      }
    } catch (e) {
      console.error('Notification creation failed:', e.message);
    }

    res.status(201).json({ msg: 'Message sent', id: msg.id, conversationId: activeConvId });
  } catch (err) {
    next(err);
  }
};

// GET /api/chat/conversations  — get conversations for the current user
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const conversations = await SupportConversation.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']],
    });
    res.json(conversations);
  } catch (err) {
    next(err);
  }
};

// POST /api/chat/conversations  — start a new support conversation
exports.createConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subject } = req.body;

    const conversation = await SupportConversation.create({
      userId,
      subject: subject || 'Support Request',
      status: 'Open',
    });

    res.status(201).json(conversation);
  } catch (err) {
    next(err);
  }
};

// GET /api/chat/conversations/:id/messages  — get messages for a conversation
exports.getConversationMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const conv = await SupportConversation.findOne({
      where: { id, userId },
    });
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await Message.findAll({
      where: { conversationId: id },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username', 'avatar'] },
      ],
      order: [['createdAt', 'ASC']],
    });

    res.json(messages);
  } catch (err) {
    next(err);
  }
};

// POST /api/chat/upload  — upload file inside chat
exports.uploadChatFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    res.status(201).json({
      fileUrl: `uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/chat/conversations/:id/read  — mark conversation as read
exports.markRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const conv = await SupportConversation.findOne({ where: { id, userId } });
    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          conversationId: id,
          senderId: { [Op.ne]: userId },
          isRead: false,
        },
      }
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
