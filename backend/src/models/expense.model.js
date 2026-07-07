const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Expense', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(150), allowNull: false },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  category: { type: DataTypes.STRING(100) },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  description: { type: DataTypes.TEXT },
  departmentId: { type: DataTypes.INTEGER, allowNull: true },
  projectId: { type: DataTypes.INTEGER, allowNull: true },
  receiptUrl: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
  approvedBy: { type: DataTypes.INTEGER, allowNull: true },
  submittedBy: { type: DataTypes.INTEGER },
}, { tableName: 'expenses', timestamps: true });
