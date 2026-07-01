const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProjectTeam = sequelize.define('ProjectTeam', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Member'
  }
}, {
  timestamps: true
});

module.exports = ProjectTeam;
