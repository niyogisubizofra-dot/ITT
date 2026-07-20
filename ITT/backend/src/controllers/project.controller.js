const { Op } = require('sequelize');
const { Project, ProjectTeam, Employee, Task, Document, Client } = require('../models');
const { paginate, paginatedResponse } = require('../utils/pagination');

exports.getAll = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const { status, clientId, search } = req.query;
    const where = {};

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (search) where.name = { [Op.iLike]: `%${search}%` };

    const { count, rows } = await Project.findAndCountAll({
      where, limit, offset,
      include: [{ model: Client, attributes: ['id', 'name', 'company'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json(paginatedResponse(rows, count, page, limit));
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: Client, attributes: ['id', 'name', 'company'] },
        { model: ProjectTeam, include: [{ model: Employee, attributes: ['id', 'firstName', 'lastName', 'position'] }] },
        { model: Task, attributes: ['id', 'title', 'status', 'priority', 'dueDate'] },
      ],
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const project = await Project.create({ ...req.body, managerId: req.user.id });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await project.update(req.body);
    res.json(project);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await project.destroy();
    res.json({ msg: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};

exports.assignTeam = async (req, res, next) => {
  try {
    const { employeeId, role } = req.body;
    const exists = await ProjectTeam.findOne({ where: { projectId: req.params.id, employeeId } });
    if (exists) return res.status(400).json({ error: 'Employee already in team' });

    const member = await ProjectTeam.create({ projectId: req.params.id, employeeId, role });
    res.status(201).json(member);
  } catch (err) {
    next(err);
  }
};

exports.removeTeamMember = async (req, res, next) => {
  try {
    await ProjectTeam.destroy({ where: { projectId: req.params.id, employeeId: req.params.employeeId } });
    res.json({ msg: 'Team member removed' });
  } catch (err) {
    next(err);
  }
};

exports.updateProgress = async (req, res, next) => {
  try {
    const { progress } = req.body;
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await project.update({ progress });
    res.json({ msg: 'Progress updated', progress });
  } catch (err) {
    next(err);
  }
};

exports.getDocuments = async (req, res, next) => {
  try {
    const docs = await Document.findAll({ where: { projectId: req.params.id }, order: [['createdAt', 'DESC']] });
    res.json(docs);
  } catch (err) {
    next(err);
  }
};
