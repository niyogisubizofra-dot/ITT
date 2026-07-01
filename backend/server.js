const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const { sequelize, User, Department, Employee, Revenue, Expense, Budget } = require('./src/models');
const { initDashboardSocket } = require('./src/sockets/dashboardSocket');
const { startBackupJob } = require('./src/jobs/backupJob');
require('dotenv').config();

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
    const ishimwe = await User.findOne({ where: { username: 'ishimwe' } });
    if (!ishimwe) {
      await User.create({
        username: 'ishimwe',
        email: 'ishimwe@example.com',
        password: '123', // hooks automatically hash this
        role: 'CEO',
        referralCode: 'ISHIMWE_ADMIN',
        balance: 5000.00
      });
      console.log('Admin account ishimwe seeded successfully (ishimwe@example.com / 123)');
    }

    const userCount = await User.count();
    if (userCount === 0) {
      console.log('No user records found. Seeding default accounts...');

      // Seed CEO
      const ceo = await User.create({
        username: 'ceo',
        email: 'ceo@example.com',
        password: 'password123', // hooks automatically hash this
        role: 'CEO',
        referralCode: 'CEOBONUS',
        balance: 1000.00
      });
      console.log('CEO account seeded (ceo@example.com / password123)');

      // Seed Staff
      const staff = await User.create({
        username: 'staff_user',
        email: 'staff@example.com',
        password: 'password123',
        role: 'Staff',
        referralCode: 'STAFFBONUS',
        balance: 0.00
      });
      console.log('Staff account seeded (staff@example.com / password123)');

      // Seed Client
      const clientUser = await User.create({
        username: 'client_user',
        email: 'client@example.com',
        password: 'password123',
        role: 'Client',
        referralCode: 'CLIENTBONUS',
        balance: 50.00
      });
      console.log('Client account seeded (client@example.com / password123)');

      // Seed mock finance data to populate dashboard charts
      await Revenue.create({ amount: 15000.00, category: 'Consulting', date: '2026-05-10', description: 'Initial project revenue' });
      await Revenue.create({ amount: 20000.00, category: 'Software Licensing', date: '2026-06-15', description: 'Product sales' });
      await Expense.create({ amount: 4500.00, category: 'Cloud Infrastructure', date: '2026-05-12', description: 'AWS Hosting fees' });
      await Expense.create({ amount: 12000.00, category: 'Payroll', date: '2026-06-28', description: 'Monthly payroll' });
      
      console.log('Default financial metrics seeded.');
    }
  } catch (err) {
    console.error('Failed to execute automatic seeders:', err.message);
  }
}

// Connect & Sync PostgreSQL, then run seeders and start server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    await sequelize.sync();
    console.log('Database models synchronized.');

    await runSeeders();

    // Start background backup jobs
    startBackupJob();

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Swagger documentation is available at http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('Server startup failed:', err.message);
    process.exit(1);
  }
}

startServer();
