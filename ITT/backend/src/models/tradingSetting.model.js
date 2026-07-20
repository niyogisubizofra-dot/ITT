const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('TradingSetting', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  value: { type: DataTypes.TEXT, allowNull: false },
}, {
  tableName: 'trading_settings',
  timestamps: true,
  indexes: [
    { fields: ['key'] }
  ]
});
