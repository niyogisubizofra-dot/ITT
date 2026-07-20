const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('TradingTransfer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
  type: { type: DataTypes.ENUM('deposit', 'withdrawal'), allowNull: false },
  reference: { type: DataTypes.STRING(100), allowNull: false, unique: true },
}, {
  tableName: 'trading_transfers',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['type'] },
    { fields: ['createdAt'] }
  ]
});
