const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Announcement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.ENUM('general', 'urgent', 'maintenance', 'event'), defaultValue: 'general' },
  targetRole: { type: DataTypes.STRING(50), defaultValue: 'all' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
  createdBy: { type: DataTypes.INTEGER },
}, { tableName: 'announcements', timestamps: true });
