require('dotenv').config();

const { Sequelize } = require('sequelize');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;

let sequelize;

if (DATABASE_URL && (DATABASE_URL.startsWith('sqlite:') || DATABASE_URL.includes('dialect=sqlite'))) {
  let storagePath = DATABASE_URL.replace(/^sqlite:(?:\/\/)?/, '');
  if (!storagePath) {
    storagePath = path.join(__dirname, '../../database.sqlite');
  } else if (!path.isAbsolute(storagePath)) {
    storagePath = path.resolve(__dirname, '../../', storagePath);
  }
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false
  });
} else {
  sequelize = new Sequelize(DATABASE_URL, {
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
}

module.exports = sequelize;
