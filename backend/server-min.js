#!/usr/bin/env node
require('dotenv').config();
const http = require('http');
const express = require('express');

const PORT = process.env.PORT || 5000;
let fullApp = null;
let isReady = false;

// Create minimal app first
const app = express();

// JSON parser
app.use(express.json());

// Health check - always available
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ready: isReady, timestamp: new Date().toISOString() });
});

// Status endpoint
app.get('/', (req, res) => {
  if (isReady) {
    res.json({ message: 'API is running', version: '1.0.0' });
  } else {
    res.status(503).json({ message: 'API is starting up', version: '1.0.0' });
  }
});

// Create server and listen immediately
const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server listening on port ${PORT}`);
});

// Error handling
server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Load full app asynchronously
setTimeout(async () => {
  try {
    console.log('Loading full application...');
    
    // Load the full app
    fullApp = require('./src/app');
    console.log('✓ Full app loaded');
    
    // Try to attach Socket.io
    try {
      const { Server } = require('socket.io');
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
      console.warn('⚠ Socket.io load warning:', err.message);
    }
    
    // Now route requests to the full app
    app.use((req, res) => {
      fullApp(req, res);
    });
    
    console.log('✓ Routing configured');
    isReady = true;
    
    // Initialize database
    initDatabase();
    
  } catch (err) {
    console.error('Error loading full app:', err.message);
    console.error(err.stack);
  }
}, 50);

async function initDatabase() {
  try {
    const { sequelize } = require('./src/models');
    
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Database connected');
    
    console.log('Syncing models...');
    await sequelize.sync();
    console.log('✓ Models synced');
    
    const { startBackupJob } = require('./src/jobs/backupJob');
    startBackupJob();
    console.log('✓ Backup job started');
    
  } catch (err) {
    console.warn('⚠ Database warning:', err.message);
  }
}

// Global handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
