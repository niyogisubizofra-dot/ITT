const { Op } = require('sequelize');
const { sequelize, User, Transaction, Investment, Employee, Project, Revenue, Expense, Client } = require('../models');

exports.getSummary = async (req, res, next) => {
  try {
    const [
      totalUsers, totalEmployees, totalProjects, totalClients,
      totalRevenue, totalExpenses, activeInvestments,
    ] = await Promise.all([
      User.count(),
      Employee.count({ where: { status: 'active' } }),
      Project.count({ where: { status: 'active' } }),
      Client.count({ where: { status: 'active' } }),
      Revenue.sum('amount', { where: { status: 'received' } }),
      Expense.sum('amount', { where: { status: 'approved' } }),
      Investment.count({ where: { status: 'active' } }),
    ]);

    res.json({
      totalUsers: totalUsers || 0,
      totalEmployees: totalEmployees || 0,
      totalProjects: totalProjects || 0,
      totalClients: totalClients || 0,
      totalRevenue: parseFloat(totalRevenue) || 0,
      totalExpenses: parseFloat(totalExpenses) || 0,
      netProfit: (parseFloat(totalRevenue) || 0) - (parseFloat(totalExpenses) || 0),
      activeInvestments: activeInvestments || 0,
    });
  } catch (err) {
    next(err);
  }
};

exports.getRevenueChart = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;
    const months = 12;
    const chart = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const [revenue, expenses] = await Promise.all([
        Revenue.sum('amount', { where: { date: { [Op.between]: [start, end] }, status: 'received' } }),
        Expense.sum('amount', { where: { date: { [Op.between]: [start, end] }, status: 'approved' } }),
      ]);

      chart.push({
        name: start.toLocaleDateString('en-US', { month: 'short' }),
        revenue: parseFloat(revenue) || 0,
        expenses: parseFloat(expenses) || 0,
        profit: (parseFloat(revenue) || 0) - (parseFloat(expenses) || 0),
      });
    }

    res.json({ chart });
  } catch (err) {
    next(err);
  }
};

exports.getProjectPerformance = async (req, res, next) => {
  try {
    const projects = await Project.findAll({
      attributes: ['id', 'name', 'status', 'progress', 'budget', 'spent', 'startDate', 'endDate'],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });
    res.json({ projects });
  } catch (err) {
    next(err);
  }
};

exports.getStaffPerformance = async (req, res, next) => {
  try {
    const employees = await Employee.findAll({
      attributes: ['id', 'firstName', 'lastName', 'position', 'performanceScore', 'status'],
      order: [['performanceScore', 'DESC']],
      limit: 10,
    });
    res.json({ employees });
  } catch (err) {
    next(err);
  }
};

exports.getClientGrowth = async (req, res, next) => {
  try {
    const months = 6;
    const chart = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const count = await Client.count({ where: { createdAt: { [Op.between]: [start, end] } } });
      chart.push({ name: start.toLocaleDateString('en-US', { month: 'short' }), clients: count });
    }

    res.json({ chart });
  } catch (err) {
    next(err);
  }
};
