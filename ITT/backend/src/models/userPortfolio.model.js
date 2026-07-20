const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('UserPortfolio', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  coinId: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.DECIMAL(18, 8), defaultValue: 0.00000000 },
  averageBuyPrice: { type: DataTypes.DECIMAL(18, 8), defaultValue: 0.00000000 },
}, {
  tableName: 'user_portfolios',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['coinId'] },
    { unique: true, fields: ['userId', 'coinId'] }
  ]
});
