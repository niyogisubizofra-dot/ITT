const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.ENUM('info', 'success', 'warning', 'error', 'system'), defaultValue: 'info' },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  link: { type: DataTypes.STRING, allowNull: true },
  readAt: { type: DataTypes.DATE, allowNull: true },
}, { 
  tableName: 'notifications', 
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['isRead'] },
    { fields: ['createdAt'] },
  ]
});
