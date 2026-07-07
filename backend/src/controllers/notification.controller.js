const { Notification } = require('../models');
const { paginate, paginatedResponse } = require('../utils/pagination');

exports.getMyNotifications = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const { count, rows } = await Notification.findAndCountAll({
      where: { userId: req.user.id },
      limit, offset,
      order: [['createdAt', 'DESC']],
    });
    res.json(paginatedResponse(rows, count, page, limit));
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { id: req.params.id, userId: req.user.id } }
    );
    res.json({ msg: 'Notification marked as read' });
  } catch (err) { next(err); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId: req.user.id, isRead: false } }
    );
    res.json({ msg: 'All notifications marked as read' });
  } catch (err) { next(err); }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.destroy({ where: { id: req.params.id, userId: req.user.id } });
    res.json({ msg: 'Notification deleted' });
  } catch (err) { next(err); }
};
