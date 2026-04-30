const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const GroupMember = sequelize.define('GroupMember', {
    conversationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Conversations', key: 'id' }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' }
    },
    role: {
        type: DataTypes.ENUM('admin', 'member'),
        defaultValue: 'member',
        allowNull: false
    },
    joinedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    leftAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    indexes: [
        { fields: ['conversationId'] },
        { fields: ['userId'] },
        { unique: true, fields: ['conversationId', 'userId'] }
    ]
});

module.exports = GroupMember;
