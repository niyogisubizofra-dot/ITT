const { Op } = require('sequelize');
const { Employee, Department, Attendance, LeaveRequest, Payroll } = require('../models');
const { paginate, paginatedResponse } = require('../utils/pagination');

exports.getAll = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const { search, status, departmentId } = req.query;
    const where = {};

    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { position: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Employee.findAndCountAll({
      where, limit, offset,
      include: [{ model: Department, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json(paginatedResponse(rows, count, page, limit));
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [{ model: Department, attributes: ['id', 'name'] }],
    });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    await employee.update(req.body);
    res.json(employee);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    await employee.destroy();
    res.json({ msg: 'Employee deleted' });
  } catch (err) {
    next(err);
  }
};

exports.getAttendance = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const { startDate, endDate } = req.query;
    const where = { employeeId: req.params.id };

    if (startDate && endDate) where.date = { [Op.between]: [startDate, endDate] };

    const { count, rows } = await Attendance.findAndCountAll({ where, limit, offset, order: [['date', 'DESC']] });
    res.json(paginatedResponse(rows, count, page, limit));
  } catch (err) {
    next(err);
  }
};

exports.markAttendance = async (req, res, next) => {
  try {
    const { date, checkIn, checkOut, status } = req.body;
    const [record, created] = await Attendance.findOrCreate({
      where: { employeeId: req.params.id, date },
      defaults: { checkIn, checkOut, status },
    });
    if (!created) await record.update({ checkIn, checkOut, status });
    res.json(record);
  } catch (err) {
    next(err);
  }
};

exports.getLeaves = async (req, res, next) => {
  try {
    const leaves = await LeaveRequest.findAll({
      where: { employeeId: req.params.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(leaves);
  } catch (err) {
    next(err);
  }
};

exports.getPayroll = async (req, res, next) => {
  try {
    const payrolls = await Payroll.findAll({
      where: { employeeId: req.params.id },
      order: [['year', 'DESC'], ['month', 'DESC']],
    });
    res.json(payrolls);
  } catch (err) {
    next(err);
  }
};

exports.getPerformance = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      attributes: ['id', 'firstName', 'lastName', 'performanceScore', 'position'],
    });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const attendanceCount = await Attendance.count({ where: { employeeId: req.params.id, status: 'present' } });
    const leaveCount = await LeaveRequest.count({ where: { employeeId: req.params.id, status: 'approved' } });

    res.json({ employee, attendanceCount, leaveCount });
  } catch (err) {
    next(err);
  }
};
