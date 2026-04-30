const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Security middleware
const { authLimiter, uploadLimiter } = require('../middleware/rateLimiter');
const { signupValidation, loginValidation, updateProfileValidation } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { sanitizeUploadParams } = require('../middleware/uploadSanitizer');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const { storage } = require('../config/cloudinary');
const upload = multer({ storage: storage });


// Register - with rate limiting and validation
router.post('/register', authLimiter, signupValidation, asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
        username,
        email,
        password: hashedPassword
    });

    // Generate JWT
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
        expiresIn: '7d'
    });

    res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
            id: user.id,
            username: user.username,
            profilePic: user.profilePic
        }
    });
}));

// Login - with rate limiting and validation
router.post('/login', authLimiter, loginValidation, asyncHandler(async (req, res) => {
    console.log('Login request received:', req.body.username);
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { username } });
    if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Log login activity
    const { LoginActivity } = require('../models');
    const userAgent = req.headers['user-agent'] || '';
    const deviceType = userAgent.includes('Mobile') ? 'Mobile' :
        userAgent.includes('Tablet') ? 'Tablet' : 'Desktop';

    await LoginActivity.create({
        userId: user.id,
        loginTime: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: userAgent,
        deviceType: deviceType,
        location: null // Can be enhanced with IP geolocation service
    });

    // Generate JWT
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
        expiresIn: '7d'
    });

    res.json({
        token,
        user: {
            id: user.id,
            username: user.username,
            profilePic: user.profilePic,
            fullname: user.fullname
        }
    });
}));

// Middleware to verify token
const { authenticateToken } = require('../middleware/auth');


// Get current user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        if (!user) return res.sendStatus(404);
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update user profile - with upload rate limiting and validation
router.put('/me', authenticateToken, uploadLimiter, updateProfileValidation, sanitizeUploadParams, upload.single('profilePic'), asyncHandler(async (req, res) => {
    const { bio, fullname, username } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) return res.sendStatus(404);

    if (bio !== undefined) user.bio = bio;
    if (fullname !== undefined) user.fullname = fullname;
    if (username !== undefined && username !== user.username) {
        // Check if username is taken
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken' });
        }
        user.username = username;
    }

    if (req.file) {
        user.profilePic = req.file.path;
    }

    await user.save();

    res.json({
        message: 'Profile updated successfully',
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            profilePic: user.profilePic,
            bio: user.bio,
            fullname: user.fullname
        }
    });
}));

// Change Password
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Old and new passwords are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        // Find user
        const user = await User.findOne({ where: { id: req.user.id } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Old password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: err.message, details: 'Failed to change password' });
    }
});

// Get Login Activity
router.get('/login-activity', authenticateToken, async (req, res) => {
    try {
        const { LoginActivity } = require('../models');

        const activities = await LoginActivity.findAll({
            where: { userId: req.user.id },
            order: [['loginTime', 'DESC']],
            limit: 20,
            attributes: ['id', 'loginTime', 'ipAddress', 'deviceType', 'location']
        });

        res.json(activities);
    } catch (err) {
        console.error('Login activity error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
