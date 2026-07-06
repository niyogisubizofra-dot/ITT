const { Revenue, Expense, Project, Employee, Client, Attendance, User } = require('../models');
const { Op } = require('sequelize');

exports.getSummary = async (req, res, next) => {
  try {
    const totalRev = await Revenue.sum('amount') || 0;
    const totalExp = await Expense.sum('amount') || 0;
    const projectCount = await Project.count();
    const staffCount = await Employee.count({ where: { status: 'Active' } });
    const clientCount = await Client.count({ where: { status: 'Active' } });

    res.json({
      totalRevenue: parseFloat(totalRev).toFixed(2),
      totalExpense: parseFloat(totalExp).toFixed(2),
      netProfit: (parseFloat(totalRev) - parseFloat(totalExp)).toFixed(2),
      activeProjects: projectCount,
      activeStaff: staffCount,
      activeClients: clientCount
    });
  } catch (err) {
    next(err);
  }
};

exports.getRevenueChart = async (req, res, next) => {
  try {
    // Generate simulated/aggregated financial timeline by grouping
    const revenues = await Revenue.findAll({ order: [['date', 'ASC']] });
    const expenses = await Expense.findAll({ order: [['date', 'ASC']] });

    // Grouping by monthly periods
    const chartMap = {};

    revenues.forEach(r => {
      const month = r.date.substring(0, 7); // "YYYY-MM"
      if (!chartMap[month]) chartMap[month] = { period: month, revenue: 0, expense: 0 };
      chartMap[month].revenue += parseFloat(r.amount);
    });

    expenses.forEach(e => {
      const month = e.date.substring(0, 7);
      if (!chartMap[month]) chartMap[month] = { period: month, revenue: 0, expense: 0 };
      chartMap[month].expense += parseFloat(e.amount);
    });

    const data = Object.values(chartMap).sort((a, b) => a.period.localeCompare(b.period));

    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getProjectPerformance = async (req, res, next) => {
  try {
    const projects = await Project.findAll({
      limit: 10,
      order: [['budget', 'DESC']]
    });

    const data = projects.map(p => ({
      id: p.id,
      name: p.name,
      budget: parseFloat(p.budget),
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate
    }));

    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getStaffPerformance = async (req, res, next) => {
  try {
    const staff = await Employee.findAll({
      include: [{ model: User, as: 'user', attributes: ['username', 'email'] }],
      limit: 10
    });

    const data = await Promise.all(staff.map(async (emp) => {
      // Calculate attendance rate (Present days / total days)
      const presentCount = await Attendance.count({ where: { employeeId: emp.id, status: 'Present' } });
      const totalCount = await Attendance.count({ where: { employeeId: emp.id } });
      const attendanceRate = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : '95.0'; // Default high performance for mock

      return {
        id: emp.id,
        username: emp.user ? emp.user.username : 'Unknown',
        email: emp.user ? emp.user.email : 'Unknown',
        position: emp.position,
        departmentId: emp.departmentId,
        attendanceRate: parseFloat(attendanceRate),
        status: emp.status
      };
    }));

    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getClientGrowth = async (req, res, next) => {
  try {
    const clients = await Client.findAll({ order: [['createdAt', 'ASC']] });
    const growthMap = {};

    clients.forEach(c => {
      const dateStr = c.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!growthMap[dateStr]) growthMap[dateStr] = 0;
      growthMap[dateStr]++;
    });

    const data = Object.entries(growthMap).map(([month, count]) => ({
      month,
      newClients: count
    }));

    res.json(data);
  } catch (err) {
    next(err);
  }
};
