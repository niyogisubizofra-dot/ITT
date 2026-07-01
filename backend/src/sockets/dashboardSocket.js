let ioInstance = null;

function initDashboardSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log('Socket client connected:', socket.id);

    // Join room for role-based dashboard updates
    socket.on('joinDashboard', (role) => {
      if (role === 'CEO') {
        socket.join('ceo_dashboard');
        console.log(`Socket ${socket.id} joined ceo_dashboard room.`);
      }
    });

    // Chat room subscription
    socket.on('joinChat', (userId) => {
      socket.join(`chat_${userId}`);
      console.log(`Socket ${socket.id} joined chat_${userId} room.`);
    });

    // Routing chat message in real time
    socket.on('sendChatMessage', (message) => {
      // message details: { senderId, senderName, receiverId, text, image, createdAt }
      if (ioInstance) {
        ioInstance.to(`chat_${message.receiverId}`).emit('receiveChatMessage', message);
        ioInstance.to(`chat_${message.senderId}`).emit('receiveChatMessage', message);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket client disconnected:', socket.id);
    });
  });
}

function broadcastDashboardUpdate(event, data) {
  if (ioInstance) {
    // Broadcast to everyone subscribed to CEO dashboard
    ioInstance.to('ceo_dashboard').emit(event, data);
    // Also broadcast a general real-time notification
    ioInstance.emit('general_update', { event, timestamp: new Date() });
  }
}

module.exports = {
  initDashboardSocket,
  broadcastDashboardUpdate
};
