const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Wrap everything in try-catch to catch initialization errors
try {
  const app = require('./src/app');
  const { sequelize, User, Department, Employee, Client, Revenue, Expense, Budget } = require('./src/models');
  const { initDashboardSocket } = require('./src/sockets/dashboardSocket');
  const bcrypt = require('bcryptjs');
  const { startBackupJob } = require('./src/jobs/backupJob');

  const PORT = process.env.PORT || 5000;
  const server = http.createServer(app);

  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  initDashboardSocket(io);
  app.set('io', io);

// Automated Seeder Function
async function runSeeders() {
  try {
    // Seed user ishimwe (admin) if not exists
    let ishimwe = await User.findOne({ where: { username: 'ishimwe' } });
    if (!ishimwe) {
      ishimwe = await User.create({
        username: 'ishimwe',
        email: 'ishimwe@example.com',
        password: '123', // hooks automatically hash this
        role: 'CEO',
        referralCode: 'ISHIMWE_ADMIN',
        balance: 0.00
      });
      console.log('Admin account ishimwe seeded successfully (ishimwe@example.com / 123)');
    } else {
      // Ensure role is CEO (admin)
      if (ishimwe.role !== 'CEO') {
        ishimwe.role = 'CEO';
        await ishimwe.save();
      }
      // Ensure password is 123
      const isMatch = await bcrypt.compare('123', ishimwe.password);
      if (!isMatch) {
        ishimwe.password = '123';
        await ishimwe.save();
        console.log('Admin account ishimwe password updated to 123');
      }
    }

    // Ensure Employee profile exists for ishimwe and is Active
    let ishimweEmployee = await Employee.findOne({ where: { userId: ishimwe.id } });
    if (!ishimweEmployee) {
      await Employee.create({
        userId: ishimwe.id,
        position: 'CEO',
        status: 'Active',
        salary: 0.00
      });
      console.log('Employee profile for ishimwe created successfully');
    } else if (ishimweEmployee.status !== 'Active' || ishimweEmployee.position !== 'CEO') {
      ishimweEmployee.status = 'Active';
      ishimweEmployee.position = 'CEO';
      await ishimweEmployee.save();
      console.log('Employee profile for ishimwe status updated to Active / CEO');
    }

    // Seed user jeremie (client) if not exists
    let jeremie = await User.findOne({ where: { username: 'jeremie' } });
    if (!jeremie) {
      jeremie = await User.create({
        username: 'jeremie',
        email: 'jeremie@example.com',
        password: '123456', // hooks automatically hash this
        role: 'Client',
        referralCode: 'JEREMIE_CLIENT',
        balance: 0.00
      });
      console.log('Client account jeremie seeded successfully (jeremie@example.com / 123456)');
    } else {
      // Ensure role is Client
      if (jeremie.role !== 'Client') {
        jeremie.role = 'Client';
        await jeremie.save();
      }
      // Ensure password is 123456
      const isMatch = await bcrypt.compare('123456', jeremie.password);
      if (!isMatch) {
        jeremie.password = '123456';
        await jeremie.save();
        console.log('Client account jeremie password updated to 123456');
      }
    }

    // Ensure Client profile exists for jeremie and is Active
    let jeremieClient = await Client.findOne({ where: { email: 'jeremie@example.com' } });
    if (!jeremieClient) {
      await Client.create({
        name: 'jeremie',
        email: 'jeremie@example.com',
        status: 'Active'
      });
      console.log('Client profile for jeremie created successfully');
    } else if (jeremieClient.status !== 'Active') {
      jeremieClient.status = 'Active';
      await jeremieClient.save();
      console.log('Client profile for jeremie status updated to Active');
    }
  } catch (err) {
    console.error('Failed to execute automatic seeders:', err.message);
  }
}

// Connect & Sync PostgreSQL, then run seeders and start server
async function connectDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    await sequelize.sync();
    console.log('Database models synchronized.');

    await runSeeders();

    // Start background backup jobs
    startBackupJob();
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    // Don't exit - server should still run even if DB connection fails initially
  }
}

// Start listening immediately
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger documentation is available at http://localhost:${PORT}/api-docs`);
});

// Try to connect to database asynchronously
connectDatabase();

} catch (err) {
  console.error('FATAL ERROR - Application initialization failed:', err.message);
  console.error(err.stack);
  // Exit gracefully
  process.exit(1);
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
