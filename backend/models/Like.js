const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Like = sequelize.define('Like', {
    postId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    indexes: [
        {
            unique: true,
            fields: ['postId', 'userId']
        }
    ]
});

module.exports = Like;
