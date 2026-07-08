const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'twoFactorSecret', 'resetPasswordToken'] },
    });

    if (!user || user.status === 'suspended') {
      return res.status(401).json({ error: 'Account not found or suspended' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Role-based access control
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Access denied: insufficient permissions' });
  }
  next();
};

// Admin only shorthand
const adminOnly = authorize('Admin');
const managerUp = authorize('Admin');

module.exports = { authenticate, authorize, adminOnly, managerUp };
