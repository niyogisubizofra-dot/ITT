const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Payroll = sequelize.define('Payroll', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  bonus: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00
  },
  deductions: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00
  },
  payDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Paid', 'Pending'),
    defaultValue: 'Pending',
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'Payrolls'
});

module.exports = Payroll;
