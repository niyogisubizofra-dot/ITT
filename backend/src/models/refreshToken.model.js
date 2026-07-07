const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('RefreshToken', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  token: { type: DataTypes.TEXT, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  isRevoked: { type: DataTypes.BOOLEAN, defaultValue: false },
  ipAddress: { type: DataTypes.STRING(45) },
}, { tableName: 'refresh_tokens', timestamps: true, updatedAt: false });
