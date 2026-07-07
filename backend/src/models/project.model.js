const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Project', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  clientId: { type: DataTypes.INTEGER, allowNull: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT },
  status: {
    type: DataTypes.ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled'),
    defaultValue: 'planning',
  },
  priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'medium' },
  startDate: { type: DataTypes.DATEONLY },
  endDate: { type: DataTypes.DATEONLY },
  budget: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  spent: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  progress: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0, max: 100 } },
  managerId: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'projects', timestamps: true });
