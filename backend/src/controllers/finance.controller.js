const { Op } = require('sequelize');
const { Revenue, Expense, Budget } = require('../models');
const { paginate, paginatedResponse } = require('../utils/pagination');
const { getDateRange } = require('../utils/helpers');

// ---- Revenue ----
exports.getAllRevenue = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const { startDate, endDate, status } = req.query;
    const where = {};
    if (status) where.status = status;
    if (startDate && endDate) where.date = { [Op.between]: [startDate, endDate] };

    const { count, rows } = await Revenue.findAndCountAll({ where, limit, offset, order: [['date', 'DESC']] });
    res.json(paginatedResponse(rows, count, page, limit));
  } catch (err) { next(err); }
};

exports.createRevenue = async (req, res, next) => {
  try {
    const revenue = await Revenue.create({ ...req.body, recordedBy: req.user.id });
    res.status(201).json(revenue);
  } catch (err) { next(err); }
};

exports.updateRevenue = async (req, res, next) => {
  try {
    const revenue = await Revenue.findByPk(req.params.id);
    if (!revenue) return res.status(404).json({ error: 'Revenue record not found' });
    await revenue.update(req.body);
    res.json(revenue);
  } catch (err) { next(err); }
};

exports.deleteRevenue = async (req, res, next) => {
  try {
    await Revenue.destroy({ where: { id: req.params.id } });
    res.json({ msg: 'Revenue record deleted' });
  } catch (err) { next(err); }
};

// ---- Expenses ----
exports.getAllExpenses = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const { status, departmentId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;

    const { count, rows } = await Expense.findAndCountAll({ where, limit, offset, order: [['date', 'DESC']] });
    res.json(paginatedResponse(rows, count, page, limit));
  } catch (err) { next(err); }
};

exports.createExpense = async (req, res, next) => {
  try {
    const expense = await Expense.create({ ...req.body, submittedBy: req.user.id });
    res.status(201).json(expense);
  } catch (err) { next(err); }
};

exports.updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    await expense.update(req.body);
    res.json(expense);
  } catch (err) { next(err); }
};

exports.approveExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    await expense.update({ status: 'approved', approvedBy: req.user.id });
    res.json({ msg: 'Expense approved' });
  } catch (err) { next(err); }
};

exports.deleteExpense = async (req, res, next) => {
  try {
    await Expense.destroy({ where: { id: req.params.id } });
    res.json({ msg: 'Expense deleted' });
  } catch (err) { next(err); }
};

// ---- Budgets ----
exports.getAllBudgets = async (req, res, next) => {
  try {
    const budgets = await Budget.findAll({ order: [['createdAt', 'DESC']] });
    res.json(budgets);
  } catch (err) { next(err); }
};

exports.createBudget = async (req, res, next) => {
  try {
    const budget = await Budget.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json(budget);
  } catch (err) { next(err); }
};

exports.updateBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findByPk(req.params.id);
    if (!budget) return res.status(404).json({ error: 'Budget not found' });
    await budget.update(req.body);
    res.json(budget);
  } catch (err) { next(err); }
};

exports.deleteBudget = async (req, res, next) => {
  try {
    await Budget.destroy({ where: { id: req.params.id } });
    res.json({ msg: 'Budget deleted' });
  } catch (err) { next(err); }
};

// ---- Cash Flow Report ----
exports.getCashFlow = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;
    const { start, end } = getDateRange(period);

    const [totalRevenue, totalExpenses] = await Promise.all([
      Revenue.sum('amount', { where: { date: { [Op.between]: [start, end] }, status: 'received' } }),
      Expense.sum('amount', { where: { date: { [Op.between]: [start, end] }, status: 'approved' } }),
    ]);

    res.json({
      period,
      startDate: start,
      endDate: end,
      totalRevenue: parseFloat(totalRevenue) || 0,
      totalExpenses: parseFloat(totalExpenses) || 0,
      netCashFlow: (parseFloat(totalRevenue) || 0) - (parseFloat(totalExpenses) || 0),
    });
  } catch (err) { next(err); }
};
