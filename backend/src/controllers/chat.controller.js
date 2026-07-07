const { Op } = require('sequelize');
const { Message, User } = require('../models');

// GET /api/chat/history  — user's own chat history with support (admin)
exports.getHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find the admin/support user (role CEO, Admin, or Chairman)
    const adminUser = await User.findOne({
      where: { role: { [Op.in]: ['CEO', 'Admin', 'Chairman'] } },
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
      createdAt: m.createdAt,
      isRead: m.isRead,
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
};

// POST /api/chat/send  — user sends message to support
exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, text, image } = req.body;
    const senderId = req.user.id;

    if (!text?.trim() && !image) {
      return res.status(400).json({ error: 'Message text or image required' });
    }

    // Default to first admin if receiverId not provided
    let targetReceiverId = receiverId;
    if (!targetReceiverId) {
      const admin = await User.findOne({
        where: { role: { [Op.in]: ['CEO', 'Admin', 'Chairman'] } },
        order: [['id', 'ASC']],
      });
      targetReceiverId = admin?.id || 1;
    }

    const msg = await Message.create({
      senderId,
      receiverId: targetReceiverId,
      text: text || null,
      image: image || null,
    });

    // Emit via Socket.IO to admin room
    try {
      const { getIO } = require('../sockets');
      const io = getIO();
      const sender = await User.findByPk(senderId, { attributes: ['id', 'username', 'avatar'] });
      const payload = {
        id: msg.id,
        senderId,
        receiverId: targetReceiverId,
        senderName: sender?.username || req.user.username,
        text: msg.text,
        image: msg.image,
        createdAt: msg.createdAt,
      };
      io.to(`user_${targetReceiverId}`).emit('receiveChatMessage', payload);
      io.to(`user_${senderId}`).emit('receiveChatMessage', payload);
    } catch (e) {}

    res.status(201).json({ msg: 'Message sent', id: msg.id });
  } catch (err) {
    next(err);
  }
};
