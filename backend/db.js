const { Sequelize } = require('sequelize');
require('dotenv').config();

// Fallback to SQLite if no Postgres config or if connection fails (simplified for now)
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './social_app.sqlite',
    logging: false
});

module.exports = { sequelize };
