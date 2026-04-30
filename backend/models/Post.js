const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const Post = sequelize.define('Post', {
    caption: DataTypes.TEXT,
    mediaUrl: DataTypes.STRING,
    mediaType: { type: DataTypes.ENUM('image', 'video'), defaultValue: 'image' },
    category: {
        type: DataTypes.ENUM('post', 'video', 'music', 'blog'),
        defaultValue: 'post'
    },
    likesCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    commentsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    sharesCount: { type: DataTypes.INTEGER, defaultValue: 0 }
});

module.exports = Post;
