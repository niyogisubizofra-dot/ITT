const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Payroll', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  employeeId: { type: DataTypes.INTEGER, allowNull: false },
  month: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 12 } },
  year: { type: DataTypes.INTEGER, allowNull: false },
  basicSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  bonus: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  deductions: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  tax: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  netSalary: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'paid', 'cancelled'), defaultValue: 'pending' },
  paidAt: { type: DataTypes.DATE, allowNull: true },
  notes: { type: DataTypes.TEXT },
  processedBy: { type: DataTypes.INTEGER },
}, { tableName: 'payrolls', timestamps: true });
