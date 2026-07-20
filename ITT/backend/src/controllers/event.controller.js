const { Event } = require('../models');
const { paginate, paginatedResponse } = require('../utils/pagination');

exports.getAll = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const { status, type } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    const { count, rows } = await Event.findAndCountAll({ where, limit, offset, order: [['startDate', 'ASC']] });
    res.json(paginatedResponse(rows, count, page, limit));
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const event = await Event.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json(event);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    await event.update(req.body);
    res.json(event);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    await event.destroy();
    res.json({ msg: 'Event deleted' });
  } catch (err) { next(err); }
};

exports.addGuest = async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const guests = [...(event.guests || []), req.body];
    await event.update({ guests });
    res.json({ msg: 'Guest added', guests });
  } catch (err) { next(err); }
};
