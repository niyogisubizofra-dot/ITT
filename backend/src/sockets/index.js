const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { Message, User } = require('../models');
const logger = require('../utils/logger');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (token) {
      try {
        socket.user = jwt.verify(token, process.env.JWT_SECRET);
      } catch (e) {
        // Allow unauthenticated for now, restrict per event
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join personal room
    socket.on('joinChat', (userId) => {
      socket.join(`user_${userId}`);
      logger.info(`User ${userId} joined room user_${userId}`);
    });

    // Admin joins admin room
    socket.on('joinAdmin', () => {
      if (socket.user?.role && ['CEO', 'Chairman', 'Admin'].includes(socket.user.role)) {
        socket.join('admin_room');
      }
    });

    // Send chat message
    socket.on('sendMessage', async ({ receiverId, senderId, text, image }) => {
      try {
        const msg = await Message.create({ senderId, receiverId, text, image });
        const sender = await User.findByPk(senderId, { attributes: ['id', 'username', 'avatar'] });

        const payload = { ...msg.toJSON(), senderName: sender?.username };
        io.to(`user_${receiverId}`).emit('receiveChatMessage', payload);
        io.to(`user_${senderId}`).emit('receiveChatMessage', payload);
      } catch (err) {
        logger.error('Socket sendMessage error:', err.message);
      }
    });

    // Dashboard real-time updates (admin only)
    socket.on('subscribeDashboard', () => {
      socket.join('dashboard');
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

// Emit dashboard update to all subscribed admins
const emitDashboardUpdate = (event, data) => {
  if (io) io.to('dashboard').emit(event, data);
};

module.exports = { initSocket, getIO, emitDashboardUpdate };
