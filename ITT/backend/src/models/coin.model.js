const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Coin', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false },
  symbol: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  icon: { type: DataTypes.STRING, allowNull: true },
  currentPrice: { type: DataTypes.DECIMAL(18, 8), allowNull: false },
  priceChangePercent: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0.00 },
  isUp: { type: DataTypes.BOOLEAN, defaultValue: true },
  marketStatus: { type: DataTypes.ENUM('open', 'closed'), defaultValue: 'open' },
  volatility: { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'coins',
  timestamps: true,
  indexes: [
    { fields: ['symbol'] },
    { fields: ['isActive'] }
  ]
});
