const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Notification = sequelize.define('Notification', {
    type: {
        type: DataTypes.ENUM('like', 'comment', 'follow', 'message', 'mention'),
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' }
    },
    actorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' }
    },
    referenceId: {
        type: DataTypes.INTEGER,
        allowNull: true // ID of the post, comment, etc.
    },
    payload: {
        type: DataTypes.JSON, // Stores preview text, mediaUrl, etc.
        defaultValue: {}
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    indexes: [
        { fields: ['userId', 'createdAt'] }, // For fetching lists
        { fields: ['userId', 'isRead'] },    // For counting unread
        // Unique constraint for idempotency: User shouldn't get same notification twice
        { unique: true, fields: ['userId', 'actorId', 'type', 'referenceId'] }
    ]
});

module.exports = Notification;
