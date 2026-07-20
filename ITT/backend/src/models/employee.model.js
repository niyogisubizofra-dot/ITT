const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Employee', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  departmentId: { type: DataTypes.INTEGER, allowNull: true },
  firstName: { type: DataTypes.STRING(50), allowNull: false },
  lastName: { type: DataTypes.STRING(50), allowNull: false },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  phone: { type: DataTypes.STRING(20) },
  position: { type: DataTypes.STRING(100) },
  salary: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  hireDate: { type: DataTypes.DATEONLY },
  status: { type: DataTypes.ENUM('active', 'inactive', 'on_leave', 'terminated'), defaultValue: 'active' },
  avatar: { type: DataTypes.STRING },
  address: { type: DataTypes.TEXT },
  emergencyContact: { type: DataTypes.STRING(100) },
  performanceScore: { type: DataTypes.DECIMAL(4, 2), defaultValue: 0 },
}, { tableName: 'employees', timestamps: true });
