const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { Message, User } = require('../models');
const { Op } = require('sequelize');

// Save & broadcast support chat message
router.post('/send', auth, async (req, res, next) => {
  try {
    const { receiverId, text, image } = req.body;
    
    if (!receiverId) {
      return res.status(400).json({ msg: 'Receiver ID is required' });
    }

    const sender = await User.findByPk(req.user.id);
    if (!sender) {
      return res.status(404).json({ msg: 'Sender not found' });
    }

    const message = await Message.create({
      senderId: sender.id,
      senderName: sender.username,
      receiverId: parseInt(receiverId),
      text: text || null,
      image: image || null
    });

    // Real-time socket broadcast via app.get('io')
    const io = req.app.get('io');
    if (io) {
      const socketMsg = {
        id: message.id,
        senderId: message.senderId,
        senderName: message.senderName,
        receiverId: message.receiverId,
        text: message.text,
        image: message.image,
        createdAt: message.createdAt.toISOString()
      };
      io.to(`chat_${message.receiverId}`).emit('receiveChatMessage', socketMsg);
      io.to(`chat_${message.senderId}`).emit('receiveChatMessage', socketMsg);
    }

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
});

// Admin endpoint: Get chat history with a specific client user
router.get('/history/:userId', auth, authorize(['CEO', 'Chairman', 'Project Manager', 'HR Manager', 'Operations Manager', 'Staff']), async (req, res, next) => {
  try {
    const { userId } = req.params;

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: 1, receiverId: parseInt(userId) },
          { senderId: parseInt(userId), receiverId: 1 }
        ]
      },
      order: [['createdAt', 'ASC']]
    });

    res.json(messages);
  } catch (err) {
    next(err);
  }
});

// Client endpoint: Get support chat history (always with admin - user ID 1)
router.get('/history', auth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: 1, receiverId: userId },
          { senderId: userId, receiverId: 1 }
        ]
      },
      order: [['createdAt', 'ASC']]
    });

    res.json(messages);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
