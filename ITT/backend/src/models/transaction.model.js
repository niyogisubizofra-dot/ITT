const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Transaction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.STRING(50), allowNull: false }, // 'deposit', 'withdrawal', 'investment', 'profit', 'referral_bonus', 'commission', 'transfer', 'buy', 'sell', 'reward', 'vip_activation'
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  status: { type: DataTypes.STRING(30), defaultValue: 'pending' }, // 'pending', 'approved', 'rejected', 'completed'
  method: { type: DataTypes.STRING(100) },
  description: { type: DataTypes.TEXT },
  reference: { type: DataTypes.STRING(100), unique: true },
  processedBy: { type: DataTypes.INTEGER, allowNull: true },
  processedAt: { type: DataTypes.DATE, allowNull: true },
  screenshotPath: { type: DataTypes.STRING, allowNull: true },
  adminNotes: { type: DataTypes.TEXT, allowNull: true },
  vipPlan: { type: DataTypes.STRING, allowNull: true },
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
