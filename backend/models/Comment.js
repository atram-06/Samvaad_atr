const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Comment = sequelize.define('Comment', {
    text: { type: DataTypes.TEXT, allowNull: false }
});

module.exports = Comment;
