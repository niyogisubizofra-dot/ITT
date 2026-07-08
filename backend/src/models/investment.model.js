const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Investment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  plan: { type: DataTypes.STRING(100), allowNull: false },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  dailyProfit: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  totalProfit: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  status: { type: DataTypes.ENUM('active', 'completed', 'cancelled'), defaultValue: 'active' },
  startDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  endDate: { type: DataTypes.DATE, allowNull: true },
  lastProfitAt: { type: DataTypes.DATE, allowNull: true },
}, { 
  tableName: 'investments', 
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['createdAt'] },
  ]
});
