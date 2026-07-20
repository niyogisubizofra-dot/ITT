const router = require('express').Router();
const { Attendance } = require('../models');
const { authenticate, managerUp } = require('../middleware/auth');
const { paginate, paginatedResponse } = require('../utils/pagination');

router.use(authenticate, managerUp);

router.get('/', async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const { date, status } = req.query;
    const where = {};
    if (date) where.date = date;
    if (status) where.status = status;
    const { count, rows } = await Attendance.findAndCountAll({ where, limit, offset, order: [['date', 'DESC']] });
    res.json(paginatedResponse(rows, count, page, limit));
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const record = await Attendance.create(req.body);
    res.status(201).json(record);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const record = await Attendance.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    await record.update(req.body);
    res.json(record);
  } catch (err) { next(err); }
});

module.exports = router;
