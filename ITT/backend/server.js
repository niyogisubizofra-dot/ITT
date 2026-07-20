require('dotenv').config();
const { createServer } = require('http');
const app = require('./src/app');
const { sequelize } = require('./src/models');
const { initSocket } = require('./src/sockets');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

initSocket(httpServer);

const start = async () => {
  try {
    // Guard: fail fast with a clear message if DB is not configured
    if (!process.env.DATABASE_URL) {
      logger.error('❌ DATABASE_URL environment variable is not set. Please add it in Render → Environment.');
      process.exit(1);
    }

    await sequelize.authenticate();
    const dialect = sequelize.getDialect();
    logger.info(`✅ Database connection established (${dialect}).`);

    // Migrate existing roles to Admin and Client before syncing to avoid Enum conflicts
    try {
      await sequelize.query(`
        UPDATE users 
        SET role = CASE 
          WHEN role IN ('CEO', 'Chairman', 'Admin') THEN 'Admin'
          ELSE 'Client'
        END
      `);
      logger.info('✅ Migrated existing user roles to Admin/Client.');
    } catch (e) {
      // Table might not exist yet, ignore
    }

    if (process.env.NODE_ENV !== 'production') {
      if (dialect === 'sqlite') {
        // SQLite doesn't support alter: true with foreign key constraints
        await sequelize.sync({ force: false });
        logger.info('✅ Database synced (force: false mode for sqlite).');
      } else {
        await sequelize.sync({ alter: true });
        logger.info('✅ Database synced (alter mode — dev only).');
      }

      // Run custom migrations for sqlite to add new columns
      if (dialect === 'sqlite') {
        const alterQueries = [
          'ALTER TABLE transactions ADD COLUMN screenshotPath VARCHAR(255);',
          'ALTER TABLE transactions ADD COLUMN adminNotes TEXT;',
          'ALTER TABLE transactions ADD COLUMN vipPlan VARCHAR(255);',
          'ALTER TABLE investments ADD COLUMN remainingDays INTEGER DEFAULT 32;',
          'ALTER TABLE investments ADD COLUMN durationDays INTEGER DEFAULT 32;',
          'ALTER TABLE investments ADD COLUMN totalExpectedReturn DECIMAL(15,2) DEFAULT 0;'
        ];
        for (const q of alterQueries) {
          try {
            await sequelize.query(q);
          } catch (err) {
            // Ignore error if column already exists
          }
        }
        logger.info('✅ SQLite migrations completed.');
      }

      // Seed default data in development only
      const seed = require('./src/seeders/defaultSeed');
      await seed();
    } else {
      // Production: only create tables that don't exist yet — no expensive ALTER TABLE scans
      await sequelize.sync({ force: false });
      logger.info('✅ Database synced (create-if-missing mode).');
    }

    // Seed VIP plans
    try {
      const { VipPlan } = require('./src/models');
      const count = await VipPlan.count();
      if (count === 0) {
        await VipPlan.bulkCreate([
          { id: 'VIP 1', name: 'VIP 1', cost: 5.00, dailyProfit: 0.20, durationDays: 32 },
          { id: 'VIP 2', name: 'VIP 2', cost: 15.00, dailyProfit: 0.65, durationDays: 32 },
          { id: 'VIP 3', name: 'VIP 3', cost: 50.00, dailyProfit: 2.50, durationDays: 32 },
          { id: 'VVP 1', name: 'VVP 1', cost: 150.00, dailyProfit: 8.50, durationDays: 32 },
          { id: 'VVP 2', name: 'VVP 2', cost: 500.00, dailyProfit: 32.00, durationDays: 32 },
          { id: 'VVP 3', name: 'VVP 3', cost: 1500.00, dailyProfit: 105.00, durationDays: 32 },
          { id: 'VVVP 1', name: 'VVVP 1', cost: 5000.00, dailyProfit: 420.00, durationDays: 32 }
        ]);
        logger.info('✅ Seeded VIP Plans database table.');
      }
    } catch (e) {
      logger.error('Failed to seed VIP plans:', e);
    }

    // Start background profits checker
    try {
      const { startProfitScheduler } = require('./src/services/investment.service');
      startProfitScheduler();
    } catch (e) {
      logger.error('Failed to start profit scheduler:', e);
    }

    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      logger.info(`📖 Swagger docs: http://localhost:${PORT}/api/docs`);
    });
  } catch (err) {
    logger.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

start();

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  httpServer.close(() => process.exit(1));
});
