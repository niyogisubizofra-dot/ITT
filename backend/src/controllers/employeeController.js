const { Employee, User, Attendance, Payroll, LeaveRequest, sequelize } = require('../models');
const { broadcastDashboardUpdate } = require('../sockets/dashboardSocket');

// Employee CRUD
exports.getAllEmployees = async (req, res, next) => {
  try {
    const { status, position } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (position) filter.position = position;

    const employees = await Employee.findAll({
      where: filter,
      include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }]
    });
    res.json(employees);
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeById = async (req, res, next) => {
  try {
    const emp = await Employee.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }]
    });
    if (!emp) return res.status(404).json({ msg: 'Employee not found' });
    res.json(emp);
  } catch (err) {
    next(err);
  }
};

exports.createEmployee = async (req, res, next) => {
  const { userId, departmentId, position, salary, hireDate } = req.body;
  try {
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) return res.status(400).json({ msg: 'User matching userId does not exist' });

    // Check if employee profile already exists
    const existing = await Employee.findOne({ where: { userId } });
    if (existing) return res.status(400).json({ msg: 'Employee profile already exists for this user' });

    const newEmp = await Employee.create({
      userId,
      departmentId,
      position,
      salary,
      hireDate,
      status: 'Active'
    });

    broadcastDashboardUpdate('staff_change', { action: 'hired', position, id: newEmp.id });

    res.status(201).json(newEmp);
  } catch (err) {
    next(err);
  }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp) return res.status(404).json({ msg: 'Employee not found' });

    await emp.update(req.body);
    res.json(emp);
  } catch (err) {
    next(err);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp) return res.status(404).json({ msg: 'Employee not found' });

    await emp.destroy();
    res.json({ msg: 'Employee profile deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Attendance
exports.logAttendance = async (req, res, next) => {
  const { employeeId, date, checkIn, checkOut, status } = req.body;
  try {
    const record = await Attendance.create({
      employeeId,
      date,
      checkIn,
      checkOut,
      status: status || 'Present'
    });
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
};

exports.getAttendanceLogs = async (req, res, next) => {
  try {
    const logs = await Attendance.findAll({
      where: { employeeId: req.params.employeeId },
      order: [['date', 'DESC']]
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

// Payroll
exports.createPayroll = async (req, res, next) => {
  const { employeeId, amount, bonus, deductions, payDate } = req.body;
  try {
    const payroll = await Payroll.create({
      employeeId,
      amount,
      bonus: bonus || 0,
      deductions: deductions || 0,
      payDate,
      status: 'Pending'
    });
    res.status(201).json(payroll);
  } catch (err) {
    next(err);
  }
};

exports.processPayrollPayment = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const payroll = await Payroll.findByPk(req.params.id, { transaction: t });
    if (!payroll) {
      await t.rollback();
      return res.status(404).json({ msg: 'Payroll record not found' });
    }

    if (payroll.status === 'Paid') {
      await t.rollback();
      return res.status(400).json({ msg: 'Payroll already processed/paid' });
    }

    payroll.status = 'Paid';
    await payroll.save({ transaction: t });

    // Also deduct expense from accounts
    const totalAmount = parseFloat(payroll.amount) + parseFloat(payroll.bonus) - parseFloat(payroll.deductions);
    const { Expense } = require('../models');
    await Expense.create({
      amount: totalAmount,
      category: 'Payroll',
      date: new Date().toISOString().substring(0, 10),
      description: `Payroll payment ID #${payroll.id} for Employee #${payroll.employeeId}`
    }, { transaction: t });

    await t.commit();
    res.json({ msg: 'Payroll status marked as Paid, financial transaction logged', payroll });
  } catch (err) {
    if (!t.finished) await t.rollback();
    next(err);
  }
};

exports.getPayrollLogs = async (req, res, next) => {
  try {
    const logs = await Payroll.findAll({
      where: { employeeId: req.params.employeeId },
      order: [['payDate', 'DESC']]
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
};

// Leave requests
exports.requestLeave = async (req, res, next) => {
  const { employeeId, type, startDate, endDate } = req.body;
  try {
    const leave = await LeaveRequest.create({
      employeeId,
      type,
      startDate,
      endDate,
      status: 'Pending'
    });
    res.status(201).json(leave);
  } catch (err) {
    next(err);
  }
};

exports.approveLeave = async (req, res, next) => {
  const { status } = req.body; // Approved or Rejected
  try {
    const leave = await LeaveRequest.findByPk(req.params.id);
    if (!leave) return res.status(404).json({ msg: 'Leave request not found' });

    leave.status = status || 'Approved';
    leave.approvedById = req.user.id;
    await leave.save();

    res.json({ msg: `Leave request status updated to ${leave.status}`, leave });
  } catch (err) {
    next(err);
  }
};
