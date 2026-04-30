const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const ConversationAttempt = sequelize.define('ConversationAttempt', {
    lastAttemptedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    indexes: [
        {
            unique: true,
            fields: ['initiatorId', 'targetId']
        }
    ]
});

module.exports = ConversationAttempt;
