const express = require('express');
const router = express.Router();
const { Post, User, Like, Comment, Notification, SavedPost, sequelize } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { sanitizeUploadParams } = require('../middleware/uploadSanitizer');
const multer = require('multer');
const path = require('path');

const { storage } = require('../config/cloudinary');
const upload = multer({ storage: storage });

// Get all posts with optional category filter
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { category } = req.query;
        const currentUserId = req.user.id;
        let whereClause = {};

        if (category && category !== 'For You') {
            // Map frontend category names to backend enum values
            const categoryMap = {
                'Videos': 'video',
                'Music': 'music',
                'Blogs': 'blog',
                'Sports': 'post', // Defaulting others to post for now
                'Tech': 'post'
            };
            const mappedCategory = categoryMap[category] || 'post';
            whereClause.category = mappedCategory;
        }

        const posts = await Post.findAll({
            where: whereClause,
            include: [{
                model: User,
                attributes: ['id', 'username', 'profilePic', 'isPrivate']
            }],
            order: [['createdAt', 'DESC']]
        });

        // Filter posts based on privacy settings
        const { Follow } = require('../models');
        const filteredPosts = await Promise.all(posts.map(async (post) => {
            const postUser = post.User;

            // If the post is from the current user, always include it
            if (post.userId === currentUserId) {
                return post;
            }

            // If the user's account is private, check if current user is following
            if (postUser.isPrivate) {
                const isFollowing = await Follow.findOne({
                    where: {
                        followerId: currentUserId,
                        followingId: post.userId
                    }
                });

                // Only include the post if the current user is following
                if (!isFollowing) {
                    return null;
                }
            }

            return post;
        }));

        // Remove null entries (posts from private accounts that user doesn't follow)
        const visiblePosts = filteredPosts.filter(post => post !== null);

        // Check if current user liked or saved these posts
        const postsWithStatus = await Promise.all(visiblePosts.map(async (post) => {
            const like = await Like.findOne({
                where: { postId: post.id, userId: currentUserId }
            });
            const saved = await SavedPost.findOne({
                where: { postId: post.id, userId: currentUserId }
            });
            const postJSON = post.toJSON();
            postJSON.isLiked = !!like;
            postJSON.isSaved = !!saved;
            return postJSON;
        }));

        res.json(postsWithStatus);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Create a new post
router.post('/', authenticateToken, sanitizeUploadParams, (req, res, next) => {
    console.log('Entering POST /api/posts');
    upload.any()(req, res, (err) => {
        if (err) {
            console.error('Multer upload error:', err);
            const statusCode = err.http_code || 500;
            return res.status(statusCode).json({ error: 'File upload failed: ' + err.message });
        }
        console.log('Multer processing complete. Files:', req.files);
        next();
    });
}, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        console.log('Processing post creation for user:', req.user.username);
        const { caption, category } = req.body;

        let mediaUrl = null;
        let mediaType = 'image'; // Default

        // Validation for non-blog posts
        if (category !== 'blog' && (!req.files || req.files.length === 0)) {
            console.error('No file uploaded for non-blog post');
            await transaction.rollback();
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (req.files && req.files.length > 0) {
            const file = req.files[0];
            mediaUrl = file.path;
            console.log('File uploaded to:', mediaUrl);
            mediaType = file.mimetype.startsWith('video') ? 'video' : 'image';
        } else if (category === 'blog') {
            mediaType = 'image'; // Blog posts treated as text-only but schema requires enum
            // We can use a placeholder or just leave mediaUrl null if schema allows
        }

        const newPost = await Post.create({
            userId: req.user.id,
            mediaUrl,
            caption,
            category: category || 'post',
            mediaType: category === 'video' ? 'video' : mediaType
        }, { transaction });

        await User.increment('postsCount', { where: { id: req.user.id }, transaction });

        await transaction.commit();
        console.log('Post created successfully:', newPost.id);

        res.status(201).json(newPost);
    } catch (err) {
        await transaction.rollback();
        console.error('Error in POST /api/posts:', err);
        res.status(500).json({ error: 'Failed to create post: ' + err.message });
    }
});

// Delete a post
router.delete('/:id', authenticateToken, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const post = await Post.findByPk(postId);
        if (!post) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.userId !== userId) {
            await transaction.rollback();
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await post.destroy({ transaction });
        await User.decrement('postsCount', { where: { id: userId }, transaction });

        await transaction.commit();

        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        await transaction.rollback();
        console.error('Error deleting post:', err);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Get posts by user
router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.id;

        // Get the user whose posts are being requested
        const targetUser = await User.findByPk(userId, {
            attributes: ['id', 'username', 'profilePic', 'isPrivate']
        });

        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // If the account is private and the requester is not the owner
        if (targetUser.isPrivate && currentUserId !== parseInt(userId)) {
            // Check if the current user is following the target user
            const { Follow } = require('../models');
            const isFollowing = await Follow.findOne({
                where: {
                    followerId: currentUserId,
                    followingId: userId
                }
            });

            if (!isFollowing) {
                // Return empty array for private accounts that user doesn't follow
                return res.json([]);
            }
        }

        // If we reach here, user has permission to view posts
        const posts = await Post.findAll({
            where: { userId },
            include: [{
                model: User,
                attributes: ['username', 'profilePic']
            }],
            order: [['createdAt', 'DESC']]
        });

        // Check if current user liked or saved these posts
        const postsWithStatus = await Promise.all(posts.map(async (post) => {
            const like = await Like.findOne({
                where: { postId: post.id, userId: currentUserId }
            });
            const saved = await SavedPost.findOne({
                where: { postId: post.id, userId: currentUserId }
            });
            const postJSON = post.toJSON();
            postJSON.isLiked = !!like;
            postJSON.isSaved = !!saved;
            return postJSON;
        }));

        res.json(postsWithStatus);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch user posts' });
    }
});

// Get single post by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findByPk(postId, {
            include: [{
                model: User,
                attributes: ['id', 'username', 'profilePic']
            }]
        });

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const like = await Like.findOne({
            where: { postId, userId: req.user.id }
        });
        const saved = await SavedPost.findOne({
            where: { postId, userId: req.user.id }
        });

        const postJSON = post.toJSON();
        postJSON.isLiked = !!like;
        postJSON.isSaved = !!saved;

        res.json(postJSON);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// Like a post
router.post('/:id/like', authenticateToken, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const post = await Post.findByPk(postId);
        if (!post) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Post not found' });
        }

        const existingLike = await Like.findOne({
            where: { postId, userId },
            transaction
        });

        let liked = false;
        if (existingLike) {
            await existingLike.destroy({ transaction });
            await post.decrement('likesCount', { transaction });
        } else {
            await Like.create({ postId, userId }, { transaction });
            await post.increment('likesCount', { transaction });
            liked = true;

            const notificationService = require('../services/notificationService');

            // Create notification if not liking own post
            if (post.userId !== userId) {
                await notificationService.createNotification({
                    userId: post.userId,
                    actorId: userId,
                    type: 'like',
                    referenceId: postId,
                    payload: { postId, preview: post.imageUrl }
                }, { transaction });
            }
        }

        await transaction.commit();

        // Fetch fresh post data to get updated count
        const updatedPost = await Post.findByPk(postId);

        // Emit socket event for real-time update
        const io = req.app.get('io');
        if (io) {
            io.to(`post_${postId}`).emit('post:like', {
                postId,
                likesCount: updatedPost.likesCount,
                liked
            });
        }

        res.json({ liked, likesCount: updatedPost.likesCount });
    } catch (err) {
        await transaction.rollback();
        console.error(err);
        res.status(500).json({ error: 'Failed to like/unlike post' });
    }
});

// Comment on a post
router.post('/:id/comments', authenticateToken, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const { text } = req.body;

        if (!text || !text.trim()) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Comment text is required' });
        }

        const post = await Post.findByPk(postId);
        if (!post) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Post not found' });
        }

        const comment = await Comment.create({
            postId,
            userId,
            text: text.trim()
        }, { transaction });

        await post.increment('commentsCount', { transaction });

        const notificationService = require('../services/notificationService');

        // Create notification if not commenting on own post
        if (post.userId !== userId) {
            await notificationService.createNotification({
                userId: post.userId,
                actorId: userId,
                type: 'comment',
                referenceId: postId,
                payload: { postId, text: text.substring(0, 50), preview: post.imageUrl }
            }, { transaction });
        }

        await transaction.commit();

        const fullComment = await Comment.findByPk(comment.id, {
            include: [{ model: User, attributes: ['id', 'username', 'profilePic'] }]
        });

        // Emit socket event for real-time update
        const io = req.app.get('io');
        if (io) {
            io.to(`post_${postId}`).emit('post:comment', {
                postId,
                commentsCount: post.commentsCount + 1,
                comment: fullComment
            });
        }

        res.status(201).json(fullComment);
    } catch (err) {
        await transaction.rollback();
        console.error(err);
        res.status(500).json({ error: 'Failed to comment' });
    }
});

// Share a post
router.post('/:id/share', authenticateToken, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const { targetUserId } = req.body;

        const post = await Post.findByPk(postId);
        if (!post) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Post not found' });
        }

        await post.increment('sharesCount', { transaction });
        await transaction.commit();

        // Emit socket event for real-time update
        const io = req.app.get('io');
        if (io) {
            io.to(`post_${postId}`).emit('post:share', {
                postId,
                sharesCount: post.sharesCount + 1
            });
        }

        res.json({ sharesCount: post.sharesCount + 1 });
    } catch (err) {
        await transaction.rollback();
        console.error(err);
        res.status(500).json({ error: 'Failed to share post' });
    }
});

// Save/Unsave a post (bookmark)
router.post('/:id/save', authenticateToken, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const post = await Post.findByPk(postId);
        if (!post) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Post not found' });
        }

        const existingSave = await SavedPost.findOne({
            where: { postId, userId },
            transaction
        });

        let saved = false;
        if (existingSave) {
            // Unsave
            await existingSave.destroy({ transaction });
        } else {
            // Save
            await SavedPost.create({ postId, userId }, { transaction });
            saved = true;
        }

        await transaction.commit();
        res.json({ saved });
    } catch (err) {
        await transaction.rollback();
        console.error(err);
        res.status(500).json({ error: 'Failed to save/unsave post' });
    }
});

// Get comments for a post
router.get('/:id/comments', async (req, res) => {
    try {
        const comments = await Comment.findAll({
            where: { postId: req.params.id },
            include: [{ model: User, attributes: ['id', 'username', 'profilePic'] }],
            order: [['createdAt', 'ASC']]
        });
        res.json(comments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Delete a comment
router.delete('/:postId/comments/:commentId', authenticateToken, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { postId, commentId } = req.params;
        const userId = req.user.id;

        const comment = await Comment.findByPk(commentId, { transaction });
        if (!comment) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Check if user owns the comment
        if (comment.userId !== userId) {
            await transaction.rollback();
            return res.status(403).json({ error: 'Not authorized to delete this comment' });
        }

        const post = await Post.findByPk(postId, { transaction });
        if (post) {
            await post.decrement('commentsCount', { transaction });
        }

        await comment.destroy({ transaction });
        await transaction.commit();

        res.json({ message: 'Comment deleted successfully' });
    } catch (err) {
        await transaction.rollback();
        console.error(err);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

module.exports = router;
