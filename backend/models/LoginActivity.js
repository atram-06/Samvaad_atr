const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const LoginActivity = sequelize.define('LoginActivity', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    loginTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    deviceType: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    location: {
        type: DataTypes.STRING(100),
        allowNull: true
    }
}, {
    timestamps: true,
    updatedAt: false
});

module.exports = LoginActivity;
