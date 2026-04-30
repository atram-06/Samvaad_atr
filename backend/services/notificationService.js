const { Notification, User, sequelize } = require('../models');
const { getIO } = require('../socket');

class NotificationService {
    async createNotification({ userId, actorId, type, referenceId, payload }, options = {}) {
        console.log(`createNotification called: ${type} from ${actorId} to ${userId}`);
        // 1. Validation
        if (userId === actorId) {
            console.log('Skipping self-notification');
            return null;
        }

        const t = options.transaction || await sequelize.transaction();
        try {
            // 2. Idempotency Check (Upsert or FindOrCreate)
            const [notification, created] = await Notification.findOrCreate({
                where: {
                    userId,
                    actorId,
                    type,
                    referenceId
                },
                defaults: {
                    payload,
                    isRead: false,
                    createdAt: new Date()
                },
                transaction: t
            });

            console.log(`Notification ${created ? 'created' : 'found'}: ${notification.id}`);

            if (!options.transaction) await t.commit();

            if (created) {
                // 3. Real-time Delivery
                try {
                    const io = getIO();
                    if (io) {
                        console.log(`Emitting notification to user_${userId}`);
                        // Fetch actor details for the UI
                        const actor = await User.findByPk(actorId, { attributes: ['id', 'username', 'profilePic'] });

                        const notificationData = {
                            id: notification.id,
                            type: notification.type,
                            actor,
                            referenceId: notification.referenceId,
                            payload: notification.payload,
                            createdAt: notification.createdAt,
                            isRead: false
                        };

                        // Emit to recipient's room
                        io.to(`user_${userId}`).emit('notification:new', notificationData);

                        // Update unread count
                        const count = await this.getUnreadCount(userId);
                        io.to(`user_${userId}`).emit('notification:count:update', { count });
                    } else {
                        console.error('Socket.IO instance not found');
                    }
                } catch (socketErr) {
                    console.error('Socket emission error:', socketErr);
                }
            }

            return notification;
        } catch (err) {
            if (!options.transaction) await t.rollback();
            console.error('Error creating notification:', err);
            return null;
        }
    }

    async getNotifications(userId, limit = 20, offset = 0) {
        return await Notification.findAll({
            where: { userId },
            include: [
                { model: User, as: 'Actor', attributes: ['id', 'username', 'profilePic'] }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
    }

    async getUnreadCount(userId) {
        return await Notification.count({
            where: { userId, isRead: false }
        });
    }

    async markAsRead(notificationId, userId) {
        const notification = await Notification.findOne({
            where: { id: notificationId, userId }
        });

        if (notification && !notification.isRead) {
            await notification.update({ isRead: true });

            // Broadcast new count
            try {
                const io = getIO();
                if (io) {
                    const count = await this.getUnreadCount(userId);
                    io.to(`user_${userId}`).emit('notification:count:update', { count });
                }
            } catch (e) { console.error('Socket error in markAsRead:', e); }
            return true;
        }
        return false;
    }

    async markAllAsRead(userId) {
        await Notification.update({ isRead: true }, {
            where: { userId, isRead: false }
        });

        try {
            const io = getIO();
            if (io) {
                io.to(`user_${userId}`).emit('notification:count:update', { count: 0 });
            }
        } catch (e) { console.error('Socket error in markAllAsRead:', e); }
        return true;
    }
}

module.exports = new NotificationService();
