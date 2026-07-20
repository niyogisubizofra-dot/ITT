const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('VipPlan', {
  id: { type: DataTypes.STRING(50), primaryKey: true }, // e.g. 'VIP 1'
  name: { type: DataTypes.STRING(100), allowNull: false },
  cost: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  dailyProfit: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  durationDays: { type: DataTypes.INTEGER, defaultValue: 32 },
}, {
  tableName: 'vip_plans',
  timestamps: true,
});
