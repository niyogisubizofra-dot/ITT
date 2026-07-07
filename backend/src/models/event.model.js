const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Event', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT },
  type: { type: DataTypes.ENUM('meeting', 'conference', 'training', 'social', 'other'), defaultValue: 'meeting' },
  startDate: { type: DataTypes.DATE, allowNull: false },
  endDate: { type: DataTypes.DATE },
  location: { type: DataTypes.STRING(200) },
  isVirtual: { type: DataTypes.BOOLEAN, defaultValue: false },
  meetingLink: { type: DataTypes.STRING },
  maxAttendees: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('scheduled', 'ongoing', 'completed', 'cancelled'), defaultValue: 'scheduled' },
  createdBy: { type: DataTypes.INTEGER },
  guests: { type: DataTypes.JSONB, defaultValue: [] },
}, { tableName: 'events', timestamps: true });
