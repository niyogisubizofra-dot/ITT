const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const employeeRoutes = require('./routes/employee');
const projectRoutes = require('./routes/project');
const financeRoutes = require('./routes/finance');
const clientRoutes = require('./routes/client');
const partnershipRoutes = require('./routes/partnership');
const documentRoutes = require('./routes/document');
const communicationRoutes = require('./routes/communication');
const securityRoutes = require('./routes/security');
const eventRoutes = require('./routes/event');
const investRoutes = require('./routes/invest');
const referralsRoutes = require('./routes/referrals');
const chatRoutes = require('./routes/chat');

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Bind routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/partnerships', partnershipRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/invest', investRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/chat', chatRoutes);

// Static directories
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Serve frontend single-page application catch-all
app.get(/(.*)/, (req, res, next) => {
  const indexPath = path.resolve(__dirname, '../../frontend/dist', 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    next();
  }
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
