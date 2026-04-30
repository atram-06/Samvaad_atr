const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Device = sequelize.define('Device', {
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    platform: {
        type: DataTypes.ENUM('android', 'ios', 'web'),
        allowNull: false
    },
    lastActiveAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = Device;
