const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('BuyTransaction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  coinId: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.DECIMAL(18, 8), allowNull: false },
  price: { type: DataTypes.DECIMAL(18, 8), allowNull: false },
  amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
  reference: { type: DataTypes.STRING(100), allowNull: false, unique: true },
}, {
  tableName: 'buy_transactions',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['coinId'] },
    { fields: ['createdAt'] }
  ]
});
