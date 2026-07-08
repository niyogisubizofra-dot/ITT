require('dotenv').config();

const { Sequelize } = require('sequelize');

const DATABASE_URL = process.env.DATABASE_URL;

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Required for Neon hosted PostgreSQL
    },
  },
  pool: {
    max: 25,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = sequelize;
