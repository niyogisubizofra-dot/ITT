const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Budget', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  totalAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  spentAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  period: { type: DataTypes.ENUM('monthly', 'quarterly', 'annual'), defaultValue: 'monthly' },
  startDate: { type: DataTypes.DATEONLY },
  endDate: { type: DataTypes.DATEONLY },
  departmentId: { type: DataTypes.INTEGER, allowNull: true },
  projectId: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.ENUM('active', 'closed', 'exceeded'), defaultValue: 'active' },
  notes: { type: DataTypes.TEXT },
  createdBy: { type: DataTypes.INTEGER },
}, { tableName: 'budgets', timestamps: true });
