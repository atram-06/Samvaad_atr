const express = require('express');
const router = express.Router();
const { User, Message, Conversation, sequelize, Notification } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

// Get all conversations for current user
router.get('/conversations', authenticateToken, async (req, res) => {
    try {
        const conversations = await Conversation.findAll({
            include: [{
                model: User,
                where: {
                    id: { [Op.ne]: req.user.id }
                },
                attributes: ['id', 'username', 'profilePic', 'fullname']
            }, {
                model: Message,
                limit: 1,
                order: [['createdAt', 'DESC']]
            }],
            // This is a simplified way to find conversations involving the user
            // In a real M:N relationship, we'd query the junction table or use correct association
            // Assuming User.belongsToMany(Conversation) is set up correctly
        });

        // Since Sequelize M:N querying can be tricky, let's try a more direct approach if the above fails
        // But first, let's rely on the association defined in index.js:
        // User.belongsToMany(Conversation, { through: 'UserConversations' });

        const user = await User.findByPk(req.user.id, {
            include: [{
                model: Conversation,
                include: [{
                    model: User,
                    where: { id: { [Op.ne]: req.user.id } },
                    attributes: ['id', 'username', 'profilePic', 'fullname']
                }, {
                    model: Message,
                    limit: 1,
                    order: [['createdAt', 'DESC']]
                }]
            }]
        });

        if (!user) return res.json([]);

        // Format response
        const formattedConversations = user.Conversations.map(conv => {
            const otherUser = conv.Users[0];
            const lastMessage = conv.Messages[0];
            return {
                id: conv.id,
                otherUser,
                lastMessage: lastMessage ? {
                    text: lastMessage.text,
                    createdAt: lastMessage.createdAt,
                    senderId: lastMessage.senderId
                } : null,
                updatedAt: conv.updatedAt
            };
        });

        // Sort by last message time
        formattedConversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        res.json(formattedConversations);
    } catch (err) {
        console.error('Error fetching conversations:', err);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Get unread message count
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all conversations for the user
        const user = await User.findByPk(userId, {
            include: [{
                model: Conversation,
                include: [{
                    model: Message,
                    where: {
                        senderId: { [Op.ne]: userId },
                        status: { [Op.ne]: 'read' }
                    },
                    required: false
                }]
            }]
        });

        if (!user) {
            return res.json({ count: 0 });
        }

        // Count unread messages across all conversations
        let unreadCount = 0;
        user.Conversations.forEach(conv => {
            unreadCount += conv.Messages.length;
        });

        res.json({ count: unreadCount });
    } catch (err) {
        console.error('Error fetching unread message count:', err);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

// Reset all messages to read (utility endpoint)
router.put('/reset-all-read', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all conversations for the user
        const user = await User.findByPk(userId, {
            include: [{
                model: Conversation,
                include: [{
                    model: Message,
                    where: {
                        senderId: { [Op.ne]: userId }
                    },
                    required: false
                }]
            }]
        });

        if (!user) {
            return res.json({ success: true, updatedCount: 0 });
        }

        // Update all messages to read
        let totalUpdated = 0;
        for (const conv of user.Conversations) {
            const [updatedCount] = await Message.update(
                {
                    status: 'read',
                    readAt: new Date()
                },
                {
                    where: {
                        conversationId: conv.id,
                        senderId: { [Op.ne]: userId }
                    }
                }
            );
            totalUpdated += updatedCount;
        }

        res.json({ success: true, updatedCount: totalUpdated });
    } catch (err) {
        console.error('Error resetting messages:', err);
        res.status(500).json({ error: 'Failed to reset messages' });
    }
});

// Start or get conversation with a user
router.post('/conversations', authenticateToken, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { targetUserId } = req.body;
        const currentUserId = req.user.id;

        // Check if conversation already exists
        // This is complex in Sequelize M:N. 
        // Strategy: Find conversations of currentUser, filter where targetUser is also a participant.

        const user = await User.findByPk(currentUserId, {
            include: [{
                model: Conversation,
                include: [{
                    model: User,
                    where: { id: targetUserId }
                }]
            }],
            transaction
        });

        let conversation = user.Conversations.find(c => c.Users.length > 0);

        if (!conversation) {
            conversation = await Conversation.create({}, { transaction });
            await conversation.addUser(currentUserId, { transaction });
            await conversation.addUser(targetUserId, { transaction });
        }

        await transaction.commit();
        res.json({ conversationId: conversation.id });
    } catch (err) {
        await transaction.rollback();
        console.error('Error creating conversation:', err);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
    try {
        const messages = await Message.findAll({
            where: { conversationId: req.params.id },
            include: [{
                model: User,
                as: 'Sender',
                attributes: ['id', 'username', 'profilePic']
            }],
            order: [['createdAt', 'ASC']]
        });
        res.json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Mark messages as read
router.put('/conversations/:id/mark-read', authenticateToken, async (req, res) => {
    try {
        const conversationId = req.params.id;
        const userId = req.user.id;

        // Update all unread messages in this conversation that were sent by others
        const [updatedCount] = await Message.update(
            {
                status: 'read',
                readAt: new Date()
            },
            {
                where: {
                    conversationId,
                    senderId: { [Op.ne]: userId },
                    status: { [Op.ne]: 'read' }
                }
            }
        );

        // Emit socket event to update message count
        if (updatedCount > 0) {
            const io = req.app.get('io');
            if (io) {
                // Recalculate unread count for this user
                const user = await User.findByPk(userId, {
                    include: [{
                        model: Conversation,
                        include: [{
                            model: Message,
                            where: {
                                senderId: { [Op.ne]: userId },
                                status: { [Op.ne]: 'read' }
                            },
                            required: false
                        }]
                    }]
                });

                let unreadCount = 0;
                if (user) {
                    user.Conversations.forEach(conv => {
                        unreadCount += conv.Messages.length;
                    });
                }

                io.to(`user_${userId}`).emit('message:count:update', { count: unreadCount });
            }
        }

        res.json({ success: true, updatedCount });
    } catch (err) {
        console.error('Error marking messages as read:', err);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});

// Send a message
router.post('/conversations/:id/messages', authenticateToken, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const conversationId = req.params.id;
        const { text } = req.body;
        const senderId = req.user.id;

        const message = await Message.create({
            conversationId,
            senderId,
            text
        }, { transaction });

        // Update conversation timestamp
        await Conversation.update({ updatedAt: new Date() }, {
            where: { id: conversationId },
            transaction
        });

        await transaction.commit();

        // Fetch full message with sender info
        const fullMessage = await Message.findByPk(message.id, {
            include: [{
                model: User,
                as: 'Sender',
                attributes: ['id', 'username', 'profilePic']
            }]
        });

        // Get participants to emit socket event
        const conversation = await Conversation.findByPk(conversationId, {
            include: [User]
        });

        const io = req.app.get('io');
        if (io && conversation) {
            conversation.Users.forEach(async user => {
                io.to(`user_${user.id}`).emit('new_message', fullMessage);

                // Create notification for other users
                if (user.id !== senderId) {
                    await notificationService.createNotification({
                        userId: user.id,
                        actorId: senderId,
                        type: 'message',
                        referenceId: conversationId,
                        payload: {
                            text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
                            senderUsername: req.user.username
                        }
                    });
                }
            });
        }

        res.status(201).json(fullMessage);
    } catch (err) {
        await transaction.rollback();
        console.error('Error sending message:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

module.exports = router;
