const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');

const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    profilePic: { type: DataTypes.STRING },
    bio: { type: DataTypes.TEXT },
    fullname: { type: DataTypes.STRING },
    postsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    followersCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    followingCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    isPrivate: { type: DataTypes.BOOLEAN, defaultValue: false }
});

module.exports = User;
