const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('DailyEarning', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  investmentId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
}, {
  tableName: 'daily_earnings',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['investmentId'] },
    { fields: ['date'] },
  ]
});
