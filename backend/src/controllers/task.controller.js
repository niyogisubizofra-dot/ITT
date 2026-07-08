const { Task, Employee } = require('../models');
const { paginate, paginatedResponse } = require('../utils/pagination');

exports.getAll = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const { status, priority, projectId, assignedTo } = req.query;
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (projectId) where.projectId = projectId;
    if (assignedTo) where.assignedTo = assignedTo;

    const { count, rows } = await Task.findAndCountAll({ where, limit, offset, order: [['dueDate', 'ASC']] });
    res.json(paginatedResponse(rows, count, page, limit));
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json(task);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (req.body.status === 'done' && task.status !== 'done') req.body.completedAt = new Date();
    await task.update(req.body);
    res.json(task);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await Task.destroy({ where: { id: req.params.id } });
    res.json({ msg: 'Task deleted' });
  } catch (err) { next(err); }
};

exports.getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.findAll({
      where: { assignedTo: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(tasks);
  } catch (err) { next(err); }
};

exports.completeMyTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, assignedTo: req.user.id }
    });
    if (!task) return res.status(404).json({ error: 'Task not found or not assigned to you' });
    await task.update({ status: 'done', completedAt: new Date() });
    res.json(task);
  } catch (err) { next(err); }
};

exports.createBulk = async (req, res, next) => {
  try {
    const { assignedTo, ...taskData } = req.body;
    if (!assignedTo || !Array.isArray(assignedTo) || assignedTo.length === 0) {
      return res.status(400).json({ error: 'At least one assignee is required' });
    }

    const tasksToCreate = assignedTo.map(userId => ({
      ...taskData,
      assignedTo: userId,
      createdBy: req.user.id
    }));

    const createdTasks = await Task.bulkCreate(tasksToCreate);
    res.status(201).json(createdTasks);
  } catch (err) { next(err); }
};

