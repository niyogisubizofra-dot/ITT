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
    logger.info('✅ Neon PostgreSQL connection established.');

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
      await sequelize.sync({ alter: true });
      logger.info('✅ Database synced (alter mode — dev only).');
      // Seed default data in development only
      const seed = require('./src/seeders/defaultSeed');
      await seed();
    } else {
      // Production: only create tables that don't exist yet — no expensive ALTER TABLE scans
      await sequelize.sync({ force: false });
      logger.info('✅ Database synced (create-if-missing mode).');
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
