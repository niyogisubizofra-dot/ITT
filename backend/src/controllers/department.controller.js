const { Department, Employee } = require('../models');

exports.getAll = async (req, res, next) => {
  try {
    const departments = await Department.findAll({ order: [['name', 'ASC']] });
    res.json(departments);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const dept = await Department.findByPk(req.params.id, {
      include: [{ model: Employee, attributes: ['id', 'firstName', 'lastName', 'position', 'status'] }],
    });
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json(dept);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json(dept);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const dept = await Department.findByPk(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    await dept.update(req.body);
    res.json(dept);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await Department.destroy({ where: { id: req.params.id } });
    res.json({ msg: 'Department deleted' });
  } catch (err) { next(err); }
};
