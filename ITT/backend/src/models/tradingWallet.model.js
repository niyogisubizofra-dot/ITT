const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('TradingWallet', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  balance: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0.00 },
  totalInvested: { type: DataTypes.DECIMAL(18, 2), defaultValue: 0.00 },
}, {
  tableName: 'trading_wallets',
  timestamps: true,
  indexes: [
    { fields: ['userId'] }
  ]
});
