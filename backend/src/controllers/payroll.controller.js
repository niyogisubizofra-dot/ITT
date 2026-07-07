const { Payroll, Employee } = require('../models');
const { paginate, paginatedResponse } = require('../utils/pagination');

exports.getAll = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const { month, year, status } = req.query;
    const where = {};
    if (month) where.month = month;
    if (year) where.year = year;
    if (status) where.status = status;

    const { count, rows } = await Payroll.findAndCountAll({
      where, limit, offset,
      include: [{ model: Employee, attributes: ['id', 'firstName', 'lastName', 'position'] }],
      order: [['year', 'DESC'], ['month', 'DESC']],
    });
    res.json(paginatedResponse(rows, count, page, limit));
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { employeeId, month, year, basicSalary, bonus = 0, deductions = 0, tax = 0 } = req.body;
    const netSalary = parseFloat(basicSalary) + parseFloat(bonus) - parseFloat(deductions) - parseFloat(tax);
    const payroll = await Payroll.create({ employeeId, month, year, basicSalary, bonus, deductions, tax, netSalary, processedBy: req.user.id });
    res.status(201).json(payroll);
  } catch (err) { next(err); }
};

exports.markPaid = async (req, res, next) => {
  try {
    const payroll = await Payroll.findByPk(req.params.id);
    if (!payroll) return res.status(404).json({ error: 'Payroll not found' });
    await payroll.update({ status: 'paid', paidAt: new Date() });
    res.json({ msg: 'Payroll marked as paid' });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const payroll = await Payroll.findByPk(req.params.id);
    if (!payroll) return res.status(404).json({ error: 'Payroll not found' });
    await payroll.update(req.body);
    res.json(payroll);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await Payroll.destroy({ where: { id: req.params.id } });
    res.json({ msg: 'Payroll deleted' });
  } catch (err) { next(err); }
};
