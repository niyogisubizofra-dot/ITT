const { Revenue, Expense, Budget, Report } = require('../models');
const { Op } = require('sequelize');

// Revenue (Income) CRUD
exports.getAllRevenues = async (req, res, next) => {
  try {
    const revenues = await Revenue.findAll();
    res.json(revenues);
  } catch (err) {
    next(err);
  }
};

exports.createRevenue = async (req, res, next) => {
  try {
    const rev = await Revenue.create(req.body);
    res.status(201).json(rev);
  } catch (err) {
    next(err);
  }
};

// Expense CRUD
exports.getAllExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.findAll();
    res.json(expenses);
  } catch (err) {
    next(err);
  }
};

exports.createExpense = async (req, res, next) => {
  try {
    const exp = await Expense.create({
      ...req.body,
      approvedById: req.user.id
    });
    res.status(201).json(exp);
  } catch (err) {
    next(err);
  }
};

// Budget CRUD
exports.getAllBudgets = async (req, res, next) => {
  try {
    const budgets = await Budget.findAll();
    res.json(budgets);
  } catch (err) {
    next(err);
  }
};

exports.createBudget = async (req, res, next) => {
  try {
    const budget = await Budget.create(req.body);
    res.status(201).json(budget);
  } catch (err) {
    next(err);
  }
};

exports.updateBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findByPk(req.params.id);
    if (!budget) return res.status(404).json({ msg: 'Budget not found' });
    await budget.update(req.body);
    res.json(budget);
  } catch (err) {
    next(err);
  }
};

// Cash flow and period reports
exports.getCashFlowReport = async (req, res, next) => {
  try {
    const totalRevenue = await Revenue.sum('amount') || 0;
    const totalExpense = await Expense.sum('amount') || 0;
    const netCashFlow = totalRevenue - totalExpense;

    res.json({
      totalRevenue: parseFloat(totalRevenue),
      totalExpense: parseFloat(totalExpense),
      netCashFlow: parseFloat(netCashFlow),
      status: netCashFlow >= 0 ? 'Surplus' : 'Deficit'
    });
  } catch (err) {
    next(err);
  }
};

exports.generatePeriodReport = async (req, res, next) => {
  const { period } = req.query; // daily, monthly, quarterly, annual
  try {
    const totalRev = await Revenue.sum('amount') || 0;
    const totalExp = await Expense.sum('amount') || 0;

    const reportTitle = `${period ? period.charAt(0).toUpperCase() + period.slice(1) : 'General'} Finance Report`;
    const reportPath = `reports/finance-${period || 'general'}-${Date.now()}.json`;

    const report = await Report.create({
      title: reportTitle,
      type: 'Financial',
      path: reportPath,
      createdById: req.user.id
    });

    res.json({
      msg: 'Financial period report logged',
      report,
      summary: {
        period: period || 'all-time',
        totalRevenue: parseFloat(totalRev),
        totalExpense: parseFloat(totalExp),
        balance: parseFloat(totalRev - totalExp),
        generatedAt: new Date()
      }
    });
  } catch (err) {
    next(err);
  }
};
