const { ActivityLog } = require('../models');

const auditLog = (action, entity) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (res.statusCode < 400) {
      ActivityLog.create({
        userId: req.user?.id || null,
        action,
        entity,
        entityId: req.params?.id || data?.id || null,
        details: { method: req.method, body: req.body, params: req.params },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }).catch(() => {});
    }
    return originalJson(data);
  };
  next();
};

module.exports = auditLog;
