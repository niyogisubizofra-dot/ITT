const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Revenue', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  source: { type: DataTypes.STRING(150), allowNull: false },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  category: { type: DataTypes.STRING(100) },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  description: { type: DataTypes.TEXT },
  clientId: { type: DataTypes.INTEGER, allowNull: true },
  projectId: { type: DataTypes.INTEGER, allowNull: true },
  invoiceNumber: { type: DataTypes.STRING(50) },
  status: { type: DataTypes.ENUM('pending', 'received', 'overdue'), defaultValue: 'received' },
  recordedBy: { type: DataTypes.INTEGER },
}, { tableName: 'revenues', timestamps: true });
