const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Report', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  type: { type: DataTypes.ENUM('financial', 'hr', 'project', 'client', 'custom'), allowNull: false },
  period: { type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'annual', 'custom') },
  startDate: { type: DataTypes.DATEONLY },
  endDate: { type: DataTypes.DATEONLY },
  data: { type: DataTypes.JSONB, defaultValue: {} },
  filePath: { type: DataTypes.STRING, allowNull: true },
  generatedBy: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('generating', 'ready', 'failed'), defaultValue: 'ready' },
}, { tableName: 'reports', timestamps: true });
