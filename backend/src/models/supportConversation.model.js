const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('SupportConversation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assignedAdminId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Open', 'Pending', 'Resolved', 'Closed'),
    defaultValue: 'Open',
  },
  subject: {
    type: DataTypes.STRING(255),
    defaultValue: 'Support Request',
  },
  lastMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'support_conversations',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['assignedAdminId'] },
    { fields: ['status'] },
    { fields: ['createdAt'] },
  ]
});
