const socketIo = require('socket.io');
const { createAdapter } = require('socket.io-redis-adapter');
const { createClient } = require('redis');
const jwt = require('jsonwebtoken');

let io;

// Helper function to save message directly (fallback when Redis is unavailable)
async function saveMessageDirectly(senderId, receiverId, text, mediaUrl, mediaType, conversationId) {
    const chatService = require('./services/chatService');
    return await chatService.sendMessage({
        senderId,
        receiverId,
        text,
        mediaUrl,
        mediaType,
        conversationId  // CRITICAL: Pass existing conversation ID
    });
}

const initSocket = async (server) => {
    io = socketIo(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    // Redis Adapter Setup
    if (process.env.REDIS_ENABLED === 'true') {
        const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
        const subClient = pubClient.duplicate();

        try {
            await Promise.all([pubClient.connect(), subClient.connect()]);
            io.adapter(createAdapter(pubClient, subClient));
            console.log('Socket.IO Redis Adapter initialized');
        } catch (err) {
            console.error('Redis Adapter connection failed:', err);
        }
    }

    // Authentication Middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            console.error('Socket Auth Error: No token provided');
            return next(new Error("Authentication error"));
        }
        try {
            const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            console.error('Socket Auth Error: Token verification failed:', err.message);
            next(new Error("Authentication error"));
        }
    });

    io.on('connection', async (socket) => {
        console.log(`User connected: ${socket.user.username} (${socket.user.id})`);

        // Join user-specific room (for notifications/list updates)
        socket.join(`user_${socket.user.id}`);

        // Handle presence
        const PresenceService = require('./services/presenceService');
        try {
            await PresenceService.setUserOnline(socket.user.id);
            socket.broadcast.emit('presence:update', { userId: socket.user.id, status: 'online' });
        } catch (presenceErr) {
            console.warn('Presence service unavailable:', presenceErr.message);
        }

        // Join Conversation Room
        socket.on('conversation:join', (conversationId) => {
            console.log(`User ${socket.user.id} joined conversation ${conversationId}`);
            socket.join(`conversation_${conversationId}`);
        });

        // Leave Conversation Room
        socket.on('conversation:leave', (conversationId) => {
            console.log(`User ${socket.user.id} left conversation ${conversationId}`);
            socket.leave(`conversation_${conversationId}`);
        });

        // Handle new message - with fallback for when Redis is unavailable
        socket.on('message:new', async (payload, ack) => {
            try {
                const { tempId, conversationId, receiverId, text, mediaUrl, mediaType } = payload;

                // Validate payload
                if (!text && !mediaUrl) {
                    if (ack) ack({ error: 'Message must have text or media' });
                    return;
                }

                console.log(`Message from ${socket.user.id}: "${text}"`);
                console.log(`  Conversation ID from frontend: ${conversationId}`);

                // Save message directly (bypassing queue since Redis may not be available)
                const result = await saveMessageDirectly(
                    socket.user.id,
                    receiverId,
                    text,
                    mediaUrl,
                    mediaType,
                    conversationId  // Pass the conversation ID from frontend
                );

                const messageData = {
                    id: result.message.id,
                    conversationId: result.conversation.id,
                    senderId: result.message.senderId,
                    receiverId: result.message.receiverId,
                    text: result.message.text,
                    mediaUrl: result.message.mediaUrl,
                    mediaType: result.message.mediaType,
                    status: result.message.status,
                    createdAt: result.message.createdAt,
                    Sender: {
                        id: socket.user.id,
                        username: socket.user.username,
                        profilePic: socket.user.profilePic
                    }
                };

                console.log(`Message saved: ${result.message.id}, broadcasting...`);

                // Check if this is a group conversation
                if (result.conversation.type === 'group') {
                    // For group chats, broadcast to all members
                    const { GroupMember } = require('./models');
                    const members = await GroupMember.findAll({
                        where: {
                            conversationId: result.conversation.id,
                            leftAt: null // Only active members
                        },
                        attributes: ['userId']
                    });

                    console.log(`Broadcasting to ${members.length} group members`);

                    // Emit to each member's user room
                    members.forEach(member => {
                        const memberRoom = `user_${member.userId}`;
                        io.to(memberRoom).emit('message:new', messageData);
                        console.log(`  → Broadcasted to member ${member.userId}`);
                    });

                    // Also broadcast to conversation room
                    const conversationRoom = `conversation_${result.conversation.id}`;
                    socket.to(conversationRoom).emit('message:new', messageData);
                } else {
                    // For direct messages, use existing logic
                    const conversationRoom = `conversation_${result.conversation.id}`;
                    socket.to(conversationRoom).emit('message:new', messageData);
                    console.log(`  → Broadcasted to conversation room: ${conversationRoom}`);

                    // Broadcast to receiver's user room
                    const receiverRoom = `user_${receiverId}`;
                    socket.to(receiverRoom).emit('message:new', messageData);
                    console.log(`  → Broadcasted to receiver room: ${receiverRoom}`);

                    // Also broadcast to sender's user room (for multi-device sync)
                    const senderRoom = `user_${socket.user.id}`;
                    socket.to(senderRoom).emit('message:new', messageData);

                    // CRITICAL: Emit back to the sender's current socket (since we removed optimistic UI update)
                    socket.emit('message:new', messageData);

                    console.log(`  → Broadcasted to sender room: ${senderRoom} and current socket`);
                }

                console.log(`✓ Message ${result.message.id} broadcasted successfully`);

                // Create notification (skip for group messages for now, can be enhanced later)
                if (result.conversation.type !== 'group') {
                    try {
                        const notificationService = require('./services/notificationService');
                        await notificationService.createNotification({
                            userId: receiverId,
                            actorId: socket.user.id,
                            type: 'message',
                            referenceId: result.conversation.id,
                            payload: {
                                text: text ? (text.length > 50 ? text.substring(0, 50) + '...' : text) : 'Sent an attachment',
                                conversationId: result.conversation.id,
                                messageId: result.message.id
                            }
                        });
                        console.log(`  → Notification created for user ${receiverId}`);
                    } catch (notifErr) {
                        console.error('Failed to create notification:', notifErr);
                    }
                }

                // Ack to sender
                if (ack) {
                    ack({
                        status: 'ok',
                        data: messageData
                    });
                }
            } catch (err) {
                console.error('Message send error:', err);
                if (ack) ack({ error: 'Failed to send message: ' + err.message });
            }
        });

        // Handle message read
        socket.on('message:read', async (payload) => {
            try {
                const { messageId, conversationId, senderId } = payload;
                const chatService = require('./services/chatService');
                await chatService.markAsRead(messageId, socket.user.id);

                // Notify via Conversation Room
                socket.to(`conversation_${conversationId}`).emit('message:read', {
                    messageId,
                    conversationId,
                    readAt: new Date()
                });

                // Also notify sender via User Room (in case they left the chat window)
                socket.to(`user_${senderId}`).emit('message:read', {
                    messageId,
                    conversationId,
                    readAt: new Date()
                });
            } catch (err) {
                console.error('Message read error:', err);
            }
        });

        // Handle typing
        socket.on('typing:start', (payload) => {
            const { conversationId } = payload;
            // Broadcast to conversation room
            socket.to(`conversation_${conversationId}`).emit('typing:start', {
                conversationId,
                userId: socket.user.id
            });
        });

        socket.on('typing:stop', (payload) => {
            const { conversationId } = payload;
            // Broadcast to conversation room
            socket.to(`conversation_${conversationId}`).emit('typing:stop', {
                conversationId,
                userId: socket.user.id
            });
        });

        // Handle presence heartbeat
        socket.on('presence:heartbeat', async () => {
            try {
                await PresenceService.heartbeat(socket.user.id);
            } catch (err) {
                // Silently fail if Redis is unavailable
                console.warn('Heartbeat failed (Redis may be unavailable)');
            }
        });

        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${socket.user.username}`);
            try {
                await PresenceService.setUserOffline(socket.user.id);
                socket.broadcast.emit('presence:update', { userId: socket.user.id, status: 'offline' });
            } catch (err) {
                console.warn('Could not update offline status (Redis may be unavailable)');
            }
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initSocket, getIO };
