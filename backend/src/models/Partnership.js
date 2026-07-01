const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Partnership = sequelize.define('Partnership', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('Sponsor', 'Investor', 'Strategic', 'Vendor'),
    allowNull: false
  },
  contactPerson: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Proposed', 'Active', 'Terminated'),
    defaultValue: 'Proposed',
    allowNull: false
  },
  fundingAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00
  }
}, {
  timestamps: true
});

module.exports = Partnership;
