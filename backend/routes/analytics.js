const express = require('express');
const router = express.Router();
const { Post, PostAnalytics, Like, Comment, User, sequelize } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get post analytics for current user
router.get('/posts', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { days = 7 } = req.query; // Default to last 7 days

        // Get user's posts
        const userPosts = await Post.findAll({
            where: { userId },
            attributes: ['id']
        });

        const postIds = userPosts.map(p => p.id);

        if (postIds.length === 0) {
            return res.json({
                summary: {
                    totalLikes: 0,
                    totalComments: 0,
                    totalViews: 0,
                    totalPosts: 0
                },
                dailyData: []
            });
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Get aggregated data by day
        const likesData = await Like.findAll({
            where: {
                postId: postIds,
                createdAt: {
                    [Op.gte]: startDate
                }
            },
            attributes: [
                [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
            raw: true
        });

        const commentsData = await Comment.findAll({
            where: {
                postId: postIds,
                createdAt: {
                    [Op.gte]: startDate
                }
            },
            attributes: [
                [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
            raw: true
        });

        // Get total counts
        const totalLikes = await Like.count({
            where: { postId: postIds }
        });

        const totalComments = await Comment.count({
            where: { postId: postIds }
        });

        // Format daily data
        const dailyMap = {};

        // Initialize all dates
        for (let i = 0; i < parseInt(days); i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            dailyMap[dateStr] = {
                date: dateStr,
                likes: 0,
                comments: 0,
                shares: 0,
                views: 0
            };
        }

        // Fill in likes data
        likesData.forEach(item => {
            if (dailyMap[item.date]) {
                dailyMap[item.date].likes = parseInt(item.count);
            }
        });

        // Fill in comments data
        commentsData.forEach(item => {
            if (dailyMap[item.date]) {
                dailyMap[item.date].comments = parseInt(item.count);
            }
        });

        const dailyData = Object.values(dailyMap).sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        );

        res.json({
            summary: {
                totalLikes,
                totalComments,
                totalViews: 0, // Can be implemented with view tracking
                totalPosts: postIds.length
            },
            dailyData
        });
    } catch (err) {
        console.error('Error fetching analytics:', err);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

module.exports = router;
