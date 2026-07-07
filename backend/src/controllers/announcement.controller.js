const { Announcement } = require('../models');
const { paginate, paginatedResponse } = require('../utils/pagination');

exports.getAll = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const where = { isActive: true };
    const { count, rows } = await Announcement.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
    res.json(paginatedResponse(rows, count, page, limit));
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const announcement = await Announcement.create({ ...req.body, createdBy: req.user.id });
    const { getIO } = require('../sockets');
    try { getIO().emit('announcement', announcement); } catch (e) {}
    res.status(201).json(announcement);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const a = await Announcement.findByPk(req.params.id);
    if (!a) return res.status(404).json({ error: 'Announcement not found' });
    await a.update(req.body);
    res.json(a);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await Announcement.destroy({ where: { id: req.params.id } });
    res.json({ msg: 'Announcement deleted' });
  } catch (err) { next(err); }
};
