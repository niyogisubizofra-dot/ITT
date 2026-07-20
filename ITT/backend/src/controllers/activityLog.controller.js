const { ActivityLog, User } = require('../models');
const { paginate, paginatedResponse } = require('../utils/pagination');

exports.getAll = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const { userId, entity } = req.query;
    const where = {};
    if (userId) where.userId = userId;
    if (entity) where.entity = entity;

    const { count, rows } = await ActivityLog.findAndCountAll({
      where, limit, offset,
      include: [{ model: User, attributes: ['id', 'username', 'email'], required: false }],
      order: [['createdAt', 'DESC']],
    });
    res.json(paginatedResponse(rows, count, page, limit));
  } catch (err) { next(err); }
};
