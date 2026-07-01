const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  checkIn: {
    type: DataTypes.STRING,
    allowNull: true
  },
  checkOut: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Present', 'Absent', 'Late', 'Half Day'),
    defaultValue: 'Present',
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'Attendances'
});

module.exports = Attendance;
