const { ActivityLog, User } = require('../models');
const { performBackup } = require('../services/backup');

exports.getActivityLogs = async (req, res, next) => {
  const { limit, offset, userId, action } = req.query;
  const filter = {};
  if (userId) filter.userId = userId;
  if (action) filter.action = action;

  try {
    const logs = await ActivityLog.findAndCountAll({
      where: filter,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['username', 'email'] }]
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

exports.triggerManualBackup = async (req, res, next) => {
  try {
    const result = await performBackup();
    res.json({
      msg: 'Manual backup completed successfully',
      file: result.file
    });
  } catch (err) {
    next(err);
  }
};
