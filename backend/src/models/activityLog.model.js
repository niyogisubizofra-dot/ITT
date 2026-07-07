const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('ActivityLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  action: { type: DataTypes.STRING(200), allowNull: false },
  entity: { type: DataTypes.STRING(100) },
  entityId: { type: DataTypes.INTEGER, allowNull: true },
  details: { type: DataTypes.JSONB, defaultValue: {} },
  ipAddress: { type: DataTypes.STRING(45) },
  userAgent: { type: DataTypes.TEXT },
}, { tableName: 'activity_logs', timestamps: true, updatedAt: false });
