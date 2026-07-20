const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Task', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  projectId: { type: DataTypes.INTEGER, allowNull: true },
  assignedTo: { type: DataTypes.INTEGER, allowNull: true },
  createdBy: { type: DataTypes.INTEGER },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('todo', 'in_progress', 'review', 'done'), defaultValue: 'todo' },
  priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'medium' },
  dueDate: { type: DataTypes.DATEONLY },
  completedAt: { type: DataTypes.DATE },
}, { tableName: 'tasks', timestamps: true });
