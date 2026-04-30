const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const ChatbotConversation = sequelize.define('ChatbotConversation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    sender: {
        type: DataTypes.ENUM('user', 'bot'),
        allowNull: false,
        defaultValue: 'user'
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'chatbot_conversations',
    timestamps: true,
    updatedAt: false
});

module.exports = ChatbotConversation;
