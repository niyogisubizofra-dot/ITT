const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Transaction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('deposit', 'withdrawal', 'investment', 'profit', 'referral_bonus', 'commission'), allowNull: false },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed'), defaultValue: 'pending' },
  method: { type: DataTypes.STRING(100) },
  description: { type: DataTypes.TEXT },
  reference: { type: DataTypes.STRING(100), unique: true },
  processedBy: { type: DataTypes.INTEGER, allowNull: true },
  processedAt: { type: DataTypes.DATE, allowNull: true },
  metadata: { type: DataTypes.JSONB, defaultValue: {} },
}, { 
  tableName: 'transactions', 
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['type'] },
    { fields: ['createdAt'] },
  ]
});
