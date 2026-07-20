const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { paginate, paginatedResponse } = require('../utils/pagination');

exports.getAll = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const { search, role, status } = req.query;
    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password', 'twoFactorSecret', 'resetPasswordToken'] },
      limit, offset,
      order: [['createdAt', 'DESC']],
    });
    res.json(paginatedResponse(rows, count, page, limit));
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'twoFactorSecret', 'resetPasswordToken'] },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...rest } = req.body;
    if (password) rest.password = await bcrypt.hash(password, 12);
    await user.update(rest);
    res.json({ msg: 'User updated' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await User.destroy({ where: { id: req.params.id } });
    res.json({ msg: 'User deleted' });
  } catch (err) { next(err); }
};

exports.updateBalance = async (req, res, next) => {
  try {
    const { balance } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.update({ balance });
    res.json({ msg: 'Balance updated', balance });
  } catch (err) { next(err); }
};
