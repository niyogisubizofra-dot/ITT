const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: false },
  role: {
    type: DataTypes.ENUM('Admin', 'Client'),
    defaultValue: 'Client',
  },
  balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0.00 },
  status: { type: DataTypes.ENUM('active', 'suspended', 'pending'), defaultValue: 'active' },
  referralCode: { type: DataTypes.STRING(20), unique: true },
  referredBy: { type: DataTypes.INTEGER, allowNull: true },
  twoFactorSecret: { type: DataTypes.STRING, allowNull: true },
  twoFactorEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  resetPasswordToken: { type: DataTypes.STRING, allowNull: true },
  resetPasswordExpires: { type: DataTypes.DATE, allowNull: true },
  lastLogin: { type: DataTypes.DATE, allowNull: true },
  avatar: { type: DataTypes.STRING, allowNull: true },
  phone: { type: DataTypes.STRING(20), allowNull: true },
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [{ fields: ['email'] }, { fields: ['username'] }, { fields: ['referralCode'] }],
});
