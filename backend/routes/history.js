const express = require('express');
const router = express.Router();
const { User, Post, Like, Comment, SavedPost } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Get liked posts history
router.get('/liked', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const likedPosts = await Like.findAll({
            where: { userId },
            include: [{
                model: Post,
                include: [{
                    model: User,
                    attributes: ['id', 'username', 'fullname', 'profilePic']
                }]
            }],
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        const posts = likedPosts.map(like => ({
            ...like.Post.toJSON(),
            likedAt: like.createdAt
        }));

        res.json(posts);
    } catch (err) {
        console.error('Error fetching liked posts:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get commented posts history
router.get('/commented', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const commentedPosts = await Comment.findAll({
            where: { userId },
            include: [{
                model: Post,
                include: [{
                    model: User,
                    attributes: ['id', 'username', 'fullname', 'profilePic']
                }]
            }],
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        // Get unique posts
        const uniquePosts = [];
        const seenPostIds = new Set();

        for (const comment of commentedPosts) {
            if (!seenPostIds.has(comment.postId)) {
                seenPostIds.add(comment.postId);
                uniquePosts.push({
                    ...comment.Post.toJSON(),
                    commentedAt: comment.createdAt,
                    lastComment: comment.text
                });
            }
        }

        res.json(uniquePosts);
    } catch (err) {
        console.error('Error fetching commented posts:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get saved posts
router.get('/saved', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const savedPosts = await SavedPost.findAll({
            where: { userId },
            include: [{
                model: Post,
                include: [{
                    model: User,
                    attributes: ['id', 'username', 'fullname', 'profilePic']
                }]
            }],
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        const posts = savedPosts.map(saved => ({
            ...saved.Post.toJSON(),
            savedAt: saved.createdAt
        }));

        res.json(posts);
    } catch (err) {
        console.error('Error fetching saved posts:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
