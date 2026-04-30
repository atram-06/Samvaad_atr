const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const UserHistory = sequelize.define('UserHistory', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Posts',
            key: 'id'
        }
    },
    actionType: {
        type: DataTypes.ENUM('liked', 'commented', 'viewed'),
        allowNull: false
    }
}, {
    timestamps: true,
    updatedAt: false,
    indexes: [
        {
            fields: ['userId', 'actionType']
        },
        {
            fields: ['createdAt']
        }
    ]
});

module.exports = UserHistory;
