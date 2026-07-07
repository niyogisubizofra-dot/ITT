const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Client', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(100), unique: true },
  phone: { type: DataTypes.STRING(20) },
  company: { type: DataTypes.STRING(150) },
  address: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('active', 'inactive', 'prospect'), defaultValue: 'active' },
  contractValue: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  contractStart: { type: DataTypes.DATEONLY },
  contractEnd: { type: DataTypes.DATEONLY },
  notes: { type: DataTypes.TEXT },
  avatar: { type: DataTypes.STRING },
}, { tableName: 'clients', timestamps: true });
