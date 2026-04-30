const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Follow = sequelize.define('Follow', {}, {
    indexes: [
        {
            unique: true,
            fields: ['followerId', 'followingId']
        }
    ]
});

module.exports = Follow;
