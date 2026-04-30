const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Message = sequelize.define('Message', {
    text: DataTypes.TEXT,
    mediaUrl: DataTypes.STRING,
    mediaType: {
        type: DataTypes.ENUM('image', 'video', 'file'),
        defaultValue: 'image'
    },
    status: {
        type: DataTypes.ENUM('sending', 'sent', 'delivered', 'read'),
        defaultValue: 'sent'
    },
    clientMessageId: {
        type: DataTypes.UUID,
        allowNull: true // Allow null for legacy messages or system messages
    },
    attachments: {
        type: DataTypes.JSONB, // Store array of { url, type, size, ... }
        defaultValue: []
    },
    deliveredAt: DataTypes.DATE,
    readAt: DataTypes.DATE
});

module.exports = Message;
