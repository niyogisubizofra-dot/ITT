const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Message', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  senderId: { type: DataTypes.INTEGER, allowNull: false },
  receiverId: { type: DataTypes.INTEGER, allowNull: false },
  conversationId: { type: DataTypes.INTEGER, allowNull: true },
  text: { type: DataTypes.TEXT },
  image: { type: DataTypes.STRING, allowNull: true },
  fileUrl: { type: DataTypes.STRING, allowNull: true },
  fileName: { type: DataTypes.STRING, allowNull: true },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  readAt: { type: DataTypes.DATE, allowNull: true },
}, { 
  tableName: 'messages', 
  timestamps: true,
  indexes: [
    { fields: ['senderId'] },
    { fields: ['receiverId'] },
    { fields: ['conversationId'] },
    { fields: ['createdAt'] },
  ]
});
