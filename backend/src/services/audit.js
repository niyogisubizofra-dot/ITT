const { ActivityLog } = require('../models');

async function logActivity(userId, action, ipAddress = null, details = null) {
  try {
    const log = await ActivityLog.create({
      userId,
      action,
      ipAddress,
      details: typeof details === 'object' ? JSON.stringify(details) : details
    });
    return log;
  } catch (err) {
    console.error('Failed to log activity:', err.message);
    return null;
  }
}

module.exports = {
  logActivity
};
