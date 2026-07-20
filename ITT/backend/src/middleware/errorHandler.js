const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message} | ${req.method} ${req.originalUrl}`, { stack: err.stack });

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors?.map((e) => e.message),
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const status = err.status || err.statusCode || 500;
  let clientMessage = err.message || 'Internal Server Error';
  
  if (
    err.name?.startsWith('SequelizeConnection') || 
    /getaddrinfo|enotfound|econnrefused|dial|connect|database/i.test(err.message || '')
  ) {
    clientMessage = 'Database connection error. Please try again later.';
  }

  res.status(status).json({
    error: clientMessage,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

const notFound = (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
};

module.exports = { errorHandler, notFound };
