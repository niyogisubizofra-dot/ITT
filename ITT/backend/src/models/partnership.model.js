const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Partnership', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  type: { type: DataTypes.ENUM('sponsor', 'investor', 'vendor', 'strategic', 'other'), defaultValue: 'strategic' },
  contactName: { type: DataTypes.STRING(100) },
  contactEmail: { type: DataTypes.STRING(100) },
  contactPhone: { type: DataTypes.STRING(20) },
  company: { type: DataTypes.STRING(150) },
  value: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  startDate: { type: DataTypes.DATEONLY },
  endDate: { type: DataTypes.DATEONLY },
  status: { type: DataTypes.ENUM('active', 'pending', 'expired', 'terminated'), defaultValue: 'pending' },
  description: { type: DataTypes.TEXT },
  documents: { type: DataTypes.JSONB, defaultValue: [] },
}, { tableName: 'partnerships', timestamps: true });
