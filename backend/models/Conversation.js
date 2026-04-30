const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Conversation = sequelize.define('Conversation', {
    type: {
        type: DataTypes.ENUM('direct', 'group'),
        defaultValue: 'direct'
    },
    groupName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    groupIcon: {
        type: DataTypes.STRING,
        allowNull: true
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' }
    },
    lastMessageId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Messages', key: 'id' }
    },
    lastMessageAt: DataTypes.DATE
});

module.exports = Conversation;
