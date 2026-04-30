const express = require('express');
const router = express.Router();
const { User, Follow, Notification, sequelize } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// Search users by username or fullname
router.get('/search', authenticateToken, async (req, res) => {
    try {
        const { q } = req.query;
        const currentUserId = req.user.id;

        if (!q || q.trim() === '') {
            return res.json([]);
        }

        const searchTerm = q.trim();

        // Search for users matching username or fullname
        const users = await User.findAll({
            where: {
                id: { [Op.ne]: currentUserId }, // Exclude current user
                [Op.or]: [
                    { username: { [Op.like]: `%${searchTerm}%` } },
                    { fullname: { [Op.like]: `%${searchTerm}%` } }
                ]
            },
            attributes: ['id', 'username', 'fullname', 'profilePic', 'bio'],
            limit: 20,
            order: [
                // Prioritize exact matches
                [sequelize.literal(`CASE WHEN username LIKE '${searchTerm}%' THEN 0 ELSE 1 END`), 'ASC'],
                ['username', 'ASC']
            ]
        });

        // Add follow status for each user
        const usersWithFollowStatus = await Promise.all(users.map(async (user) => {
            const isFollowing = await Follow.findOne({
                where: {
                    followerId: currentUserId,
                    followingId: user.id
                }
            });
            return {
                ...user.toJSON(),
                isFollowing: !!isFollowing
            };
        }));

        res.json(usersWithFollowStatus);
    } catch (err) {
        console.error('Error searching users:', err);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

// Get suggested users (random 5 users excluding current user)
router.get('/suggested', authenticateToken, async (req, res) => {
    try {
        const users = await User.findAll({
            where: {
                id: { [Op.ne]: req.user.id } // Exclude current user
            },
            attributes: ['id', 'username', 'fullname', 'profilePic', 'bio'],
            limit: 5,
            order: sequelize.random() // Randomize results
        });

        // Check follow status for each user
        const usersWithFollowStatus = await Promise.all(users.map(async (user) => {
            const isFollowing = await Follow.findOne({
                where: {
                    followerId: req.user.id,
                    followingId: user.id
                }
            });
            return {
                ...user.toJSON(),
                isFollowing: !!isFollowing
            };
        }));

        res.json(usersWithFollowStatus);
    } catch (err) {
        console.error('Error fetching suggested users:', err);
        res.status(500).json({ error: 'Failed to fetch suggested users' });
    }
});

// Follow/Unfollow user
router.post('/:id/follow', authenticateToken, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user.id;

        if (targetUserId == currentUserId) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        const targetUser = await User.findByPk(targetUserId);
        if (!targetUser) {
            await transaction.rollback();
            return res.status(404).json({ error: 'User not found' });
        }

        const existingFollow = await Follow.findOne({
            where: {
                followerId: currentUserId,
                followingId: targetUserId
            },
            transaction
        });

        let isFollowing = false;

        if (existingFollow) {
            // Unfollow
            await existingFollow.destroy({ transaction });
            await User.decrement('followersCount', { where: { id: targetUserId }, transaction });
            await User.decrement('followingCount', { where: { id: currentUserId }, transaction });
        } else {
            // Follow
            await Follow.create({
                followerId: currentUserId,
                followingId: targetUserId
            }, { transaction });
            await User.increment('followersCount', { where: { id: targetUserId }, transaction });
            await User.increment('followingCount', { where: { id: currentUserId }, transaction });
            isFollowing = true;

            const notificationService = require('../services/notificationService');

            // ... (inside follow route)
            // Create notification
            await notificationService.createNotification({
                userId: targetUserId,
                actorId: currentUserId,
                type: 'follow',
                referenceId: null, // No specific reference for follow, or could be followerId
                payload: { username: req.user.username }
            }, { transaction });
        }

        await transaction.commit();
        // Removed manual socket emit, service handles it.

        res.json({ isFollowing });
    } catch (err) {
        await transaction.rollback();
        console.error('Error in follow/unfollow:', err);
        res.status(500).json({ error: 'Failed to follow/unfollow user' });
    }
});

// Get followers and following for current user (for share modal)
router.get('/followers-following', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get follower IDs
        const followers = await Follow.findAll({
            where: { followingId: userId },
            attributes: ['followerId']
        });

        // Get following IDs
        const following = await Follow.findAll({
            where: { followerId: userId },
            attributes: ['followingId']
        });

        // Extract user IDs
        const followerIds = followers.map(f => f.followerId);
        const followingIds = following.map(f => f.followingId);

        // Combine and deduplicate
        const allUserIds = [...new Set([...followerIds, ...followingIds])];

        // Fetch user details
        const users = await User.findAll({
            where: { id: allUserIds },
            attributes: ['id', 'username', 'fullname', 'profilePic']
        });

        res.json(users);
    } catch (err) {
        console.error('Error fetching followers/following:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Toggle Privacy Setting
router.put('/privacy', authenticateToken, async (req, res) => {
    try {
        const { isPrivate } = req.body;

        if (typeof isPrivate !== 'boolean') {
            return res.status(400).json({ message: 'isPrivate must be a boolean value' });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isPrivate = isPrivate;
        await user.save();

        res.json({
            message: 'Privacy setting updated successfully',
            isPrivate: user.isPrivate
        });
    } catch (err) {
        console.error('Error updating privacy:', err);
        res.status(500).json({ error: 'Failed to update privacy setting' });
    }
});

module.exports = router;
