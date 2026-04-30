const { Worker } = require('bullmq');
const connection = require('../lib/redis');
const chatService = require('../services/chatService');
const notificationService = require('../services/notificationService');

const chatWorker = new Worker('chat-persistence', async (job) => {
    const { senderId, receiverId, text, mediaUrl, mediaType, tempId, clientMessageId, attachments } = job.data;

    console.log(`Processing persistence for message: ${clientMessageId || tempId}`);

    try {
        // We use the existing sendMessage service which handles conversation creation/lookup
        // and message creation.
        // Note: For existing conversations, this might be slightly redundant in looking up
        // the conversation again, but it ensures consistency.
        const result = await chatService.sendMessage({
            senderId,
            receiverId,
            text,
            mediaUrl,
            mediaType,
            tempId
        });

        // If we passed clientMessageId and attachments, we might need to update the message
        if (clientMessageId || (attachments && attachments.length)) {
            await result.message.update({
                clientMessageId,
                attachments
            });
        }

        // Broadcast the *persisted* message to relevant rooms
        // We need access to the IO instance or use the Redis Emitter if running in a separate process.
        // Since this worker might run in a separate process, we should use 'socket.io-emitter' or just the Redis client to publish?
        // Actually, since we are in the same codebase, we can try to get the IO instance if it's exported, 
        // OR simpler: use the existing Redis Pub/Sub that Socket.IO uses.

        // However, `socket.io-redis-adapter` handles this. 
        // Let's assume for now this worker runs in the SAME process as the server (via `worker.js` which we haven't created yet but will likely just import this).
        // If it runs separately, we need `socket.io-emitter`.

        // For this setup, let's use a helper to broadcast.
        const { getIO } = require('../socket');
        try {
            const io = getIO();
            const messageData = {
                id: result.message.id,
                conversationId: result.conversation.id,
                senderId: result.message.senderId,
                text: result.message.text,
                mediaUrl: result.message.mediaUrl,
                mediaType: result.message.mediaType,
                status: result.message.status,
                createdAt: result.message.createdAt,
                clientMessageId: result.message.clientMessageId,
                attachments: result.message.attachments
            };

            // Broadcast to conversation room
            io.to(`conversation_${result.conversation.id}`).emit('message:new', messageData);

            // Broadcast to user rooms
            io.to(`user_${receiverId}`).emit('message:new', messageData);
            io.to(`user_${senderId}`).emit('message:new', messageData); // Sync sender's other devices

            console.log(`Broadcasted message ${result.message.id} to conversation ${result.conversation.id}`);

            // Create notification for the receiver
            try {
                await notificationService.createNotification({
                    userId: receiverId,
                    actorId: senderId,
                    type: 'message',
                    referenceId: result.conversation.id,
                    payload: {
                        text: text ? (text.length > 50 ? text.substring(0, 50) + '...' : text) : 'Sent an attachment',
                        conversationId: result.conversation.id,
                        messageId: result.message.id
                    }
                });
                console.log(`Created message notification for user ${receiverId}`);
            } catch (notifErr) {
                console.error('Failed to create message notification:', notifErr);
            }
        } catch (ioErr) {
            console.warn('Could not broadcast from worker (IO might not be initialized if separate process):', ioErr.message);
        }

        return result;
    } catch (err) {
        console.error('Persistence failed:', err);
        throw err;
    }
}, { connection });

chatWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
});

chatWorker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err);
});

module.exports = chatWorker;
