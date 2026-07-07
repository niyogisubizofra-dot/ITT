const { Notification } = require('../models');
const { getIO } = require('../sockets');

const createNotification = async ({ userId, title, message, type = 'info', link = null }) => {
  const notification = await Notification.create({ userId, title, message, type, link });

  // Push real-time via Socket.IO
  try {
    const io = getIO();
    io.to(`user_${userId}`).emit('notification', notification);
  } catch (e) {}

  return notification;
};

const broadcastNotification = async ({ title, message, type = 'info', userIds = [] }) => {
  const notifications = await Notification.bulkCreate(
    userIds.map((userId) => ({ userId, title, message, type }))
  );

  try {
    const io = getIO();
    userIds.forEach((uid) => io.to(`user_${uid}`).emit('notification', { title, message, type }));
  } catch (e) {}

  return notifications;
};

module.exports = { createNotification, broadcastNotification };
