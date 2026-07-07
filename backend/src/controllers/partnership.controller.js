const { Partnership } = require('../models');
const { paginate, paginatedResponse } = require('../utils/pagination');

exports.getAll = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const { status, type } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    const { count, rows } = await Partnership.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
    res.json(paginatedResponse(rows, count, page, limit));
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const p = await Partnership.findByPk(req.params.id);
    if (!p) return res.status(404).json({ error: 'Partnership not found' });
    res.json(p);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const p = await Partnership.create(req.body);
    res.status(201).json(p);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const p = await Partnership.findByPk(req.params.id);
    if (!p) return res.status(404).json({ error: 'Partnership not found' });
    await p.update(req.body);
    res.json(p);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await Partnership.destroy({ where: { id: req.params.id } });
    res.json({ msg: 'Partnership deleted' });
  } catch (err) { next(err); }
};
