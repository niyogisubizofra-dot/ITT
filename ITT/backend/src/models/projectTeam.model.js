const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('ProjectTeam', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false },
  employeeId: { type: DataTypes.INTEGER, allowNull: false },
  role: { type: DataTypes.STRING(100), defaultValue: 'Member' },
  joinedAt: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
}, { tableName: 'project_teams', timestamps: true });
