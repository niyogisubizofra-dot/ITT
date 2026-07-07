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
    await sequelize.authenticate();
    logger.info('✅ Neon PostgreSQL connection established.');

    // Sync all models — creates tables if they don't exist, alters columns safely
    await sequelize.sync({ alter: true });
    logger.info('✅ Database synced (alter mode).');

    // Run seeder after sync
    const seed = require('./src/seeders/defaultSeed');
    await seed();

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
