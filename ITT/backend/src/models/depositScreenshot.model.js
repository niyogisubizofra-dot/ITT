const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('DepositScreenshot', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  transactionId: { type: DataTypes.INTEGER, allowNull: true },
  path: { type: DataTypes.STRING, allowNull: false },
  filename: { type: DataTypes.STRING, allowNull: false },
  size: { type: DataTypes.INTEGER, allowNull: false },
  hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
}, {
  tableName: 'deposit_screenshots',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['transactionId'] },
    { fields: ['hash'] },
  ]
});
