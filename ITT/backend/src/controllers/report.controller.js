const { Op } = require('sequelize');
const { Report, Revenue, Expense, Employee, Project, Client, Attendance, Payroll } = require('../models');
const { getDateRange } = require('../utils/helpers');
const { paginate, paginatedResponse } = require('../utils/pagination');

exports.getAll = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const { count, rows } = await Report.findAndCountAll({ limit, offset, order: [['createdAt', 'DESC']] });
    res.json(paginatedResponse(rows, count, page, limit));
  } catch (err) { next(err); }
};

exports.generateFinancialReport = async (req, res, next) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    const range = startDate && endDate ? { start: new Date(startDate), end: new Date(endDate) } : getDateRange(period);

    const [totalRevenue, totalExpenses] = await Promise.all([
      Revenue.sum('amount', { where: { date: { [Op.between]: [range.start, range.end] }, status: 'received' } }),
      Expense.sum('amount', { where: { date: { [Op.between]: [range.start, range.end] }, status: 'approved' } }),
    ]);

    const data = {
      period,
      startDate: range.start,
      endDate: range.end,
      totalRevenue: parseFloat(totalRevenue) || 0,
      totalExpenses: parseFloat(totalExpenses) || 0,
      netProfit: (parseFloat(totalRevenue) || 0) - (parseFloat(totalExpenses) || 0),
    };

    const report = await Report.create({
      title: `Financial Report - ${period}`,
      type: 'financial',
      period,
      startDate: range.start,
      endDate: range.end,
      data,
      generatedBy: req.user.id,
    });

    res.json(report);
  } catch (err) { next(err); }
};

exports.generateHRReport = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;
    const range = getDateRange(period);

    const [totalEmployees, activeEmployees, onLeave, attendanceRate] = await Promise.all([
      Employee.count(),
      Employee.count({ where: { status: 'active' } }),
      Employee.count({ where: { status: 'on_leave' } }),
      Attendance.count({ where: { status: 'present', date: { [Op.between]: [range.start, range.end] } } }),
    ]);

    const data = { totalEmployees, activeEmployees, onLeave, attendanceCount: attendanceRate, period };

    const report = await Report.create({
      title: `HR Report - ${period}`,
      type: 'hr',
      period,
      startDate: range.start,
      endDate: range.end,
      data,
      generatedBy: req.user.id,
    });

    res.json(report);
  } catch (err) { next(err); }
};

exports.generateProjectReport = async (req, res, next) => {
  try {
    const [total, active, completed, cancelled] = await Promise.all([
      Project.count(),
      Project.count({ where: { status: 'active' } }),
      Project.count({ where: { status: 'completed' } }),
      Project.count({ where: { status: 'cancelled' } }),
    ]);

    const data = { total, active, completed, cancelled };

    const report = await Report.create({
      title: 'Project Status Report',
      type: 'project',
      data,
      generatedBy: req.user.id,
    });

    res.json(report);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await Report.destroy({ where: { id: req.params.id } });
    res.json({ msg: 'Report deleted' });
  } catch (err) { next(err); }
};
