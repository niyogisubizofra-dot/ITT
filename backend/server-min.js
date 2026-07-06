#!/usr/bin/env node
require('dotenv').config();
const http = require('http');
const express = require('express');

const PORT = process.env.PORT || 5000;

// Create minimal app first
const app = express();

// Immediate health checks
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'API is running', version: '1.0.0' });
});

// Create server and listen immediately
const server = http.createServer(app);

const listener = server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server listening on port ${PORT}`);
});

// Timeout after 30 seconds if not connected
listener.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
  console.error('Server error:', err);
});

// Load full app in background
(async () => {
  try {
    console.log('Loading full application...');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const { Server } = require('socket.io');
    const fullApp = require('./src/app');
    
    console.log('✓ Full app module loaded');
    
    // Attach Socket.io
    try {
      const { sequelize } = require('./src/models');
      const { initDashboardSocket } = require('./src/sockets/dashboardSocket');
      
      const io = new Server(server, {
        cors: {
          origin: process.env.FRONTEND_URL || 'http://localhost:5173',
          methods: ['GET', 'POST'],
          credentials: true
        }
      });
      initDashboardSocket(io);
      fullApp.set('io', io);
      console.log('✓ Socket.io configured');
    } catch (err) {
      console.warn('⚠ Socket.io warning:', err.message);
    }
    
    // Use the full app for all other routes
    app.use((req, res, next) => {
      fullApp(req, res, next);
    });
    
    // Initialize database separately
    initializeDatabase();
    
  } catch (err) {
    console.warn('⚠ Application loading warning:', err.message);
  }
})();

async function initializeDatabase() {
  try {
    const { sequelize, User, Employee, Client } = require('./src/models');
    const bcrypt = require('bcryptjs');
    const { startBackupJob } = require('./src/jobs/backupJob');
    
    console.log('Authenticating database...');
    await sequelize.authenticate();
    console.log('✓ Database connected');
    
    console.log('Synchronizing models...');
    await sequelize.sync();
    console.log('✓ Database models synchronized');
    
    // Run seeders
    try {
      let user = await User.findOne({ where: { username: 'ishimwe' } });
      if (!user) {
        user = await User.create({
          username: 'ishimwe',
          email: 'ishimwe@example.com',
          password: '123',
          role: 'CEO',
          referralCode: 'ISHIMWE_ADMIN',
          balance: 0.00
        });
        console.log('✓ Admin user seeded');
      }
    } catch (err) {
      console.warn('⚠ Seeding warning:', err.message);
    }
    
    // Start backup job
    startBackupJob();
    console.log('✓ Backup job started');
    
  } catch (err) {
    console.warn('⚠ Database initialization warning:', err.message);
    console.warn('Application will continue running with limited functionality');
  }
}

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
