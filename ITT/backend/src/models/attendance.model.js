const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Attendance', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  employeeId: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  checkIn: { type: DataTypes.TIME },
  checkOut: { type: DataTypes.TIME },
  status: { type: DataTypes.ENUM('present', 'absent', 'late', 'half_day', 'holiday'), defaultValue: 'present' },
  hoursWorked: { type: DataTypes.DECIMAL(4, 2) },
  notes: { type: DataTypes.TEXT },
}, { tableName: 'attendances', timestamps: true });
