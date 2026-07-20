const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Document', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  originalName: { type: DataTypes.STRING(200) },
  path: { type: DataTypes.STRING, allowNull: false },
  mimeType: { type: DataTypes.STRING(100) },
  size: { type: DataTypes.INTEGER },
  category: { type: DataTypes.STRING(100), defaultValue: 'General' },
  projectId: { type: DataTypes.INTEGER, allowNull: true },
  uploadedBy: { type: DataTypes.INTEGER },
  isPublic: { type: DataTypes.BOOLEAN, defaultValue: false },
  description: { type: DataTypes.TEXT },
}, { tableName: 'documents', timestamps: true });
