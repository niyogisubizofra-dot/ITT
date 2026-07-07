const { LeaveRequest, Employee } = require('../models');
const { paginate, paginatedResponse } = require('../utils/pagination');

exports.getAll = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const { status, type } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const { count, rows } = await LeaveRequest.findAndCountAll({
      where, limit, offset,
      include: [{ model: Employee, attributes: ['id', 'firstName', 'lastName', 'position'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(paginatedResponse(rows, count, page, limit));
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const leave = await LeaveRequest.create({ ...req.body, days });
    res.status(201).json(leave);
  } catch (err) { next(err); }
};

exports.approve = async (req, res, next) => {
  try {
    const leave = await LeaveRequest.findByPk(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    await leave.update({ status: 'approved', approvedBy: req.user.id, approvedAt: new Date() });
    res.json({ msg: 'Leave approved' });
  } catch (err) { next(err); }
};

exports.reject = async (req, res, next) => {
  try {
    const leave = await LeaveRequest.findByPk(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    await leave.update({ status: 'rejected', approvedBy: req.user.id, rejectionReason: req.body.reason });
    res.json({ msg: 'Leave rejected' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await LeaveRequest.destroy({ where: { id: req.params.id } });
    res.json({ msg: 'Leave request deleted' });
  } catch (err) { next(err); }
};
