const { Message, Conversation, ConversationAttempt, User, sequelize } = require('../models');
const { Op } = require('sequelize');

class ChatService {
    async sendMessage({ senderId, receiverId, text, mediaUrl, mediaType, tempId, conversationId }) {
        const transaction = await sequelize.transaction();
        try {
            console.log('Step 1: Find/Create Conversation');
            console.log('  Provided conversationId:', conversationId);

            let conversation;

            // If conversationId is provided, use it
            if (conversationId) {
                console.log('Using existing conversation:', conversationId);
                conversation = await Conversation.findByPk(conversationId, { transaction });
                if (!conversation) {
                    throw new Error(`Conversation ${conversationId} not found`);
                }
            } else {
                // Find or Create Conversation
                // Fallback: Check if conversation exists via UserConversations
                const [user1Convos, user2Convos] = await Promise.all([
                    sequelize.query(`SELECT "conversationId" FROM "UserConversations" WHERE "UserId" = ${senderId}`, { type: sequelize.QueryTypes.SELECT }),
                    sequelize.query(`SELECT "conversationId" FROM "UserConversations" WHERE "UserId" = ${receiverId}`, { type: sequelize.QueryTypes.SELECT })
                ]);

                const user1Ids = new Set(user1Convos.map(c => c.conversationId));
                const commonConvoId = user2Convos.find(c => user1Ids.has(c.conversationId))?.conversationId;

                if (commonConvoId) {
                    console.log('Found existing conversation:', commonConvoId);
                    conversation = await Conversation.findByPk(commonConvoId, { transaction });
                } else {
                    console.log('Creating new conversation');
                    conversation = await Conversation.create({ type: 'direct' }, { transaction });
                    await conversation.addUsers([senderId, receiverId], { transaction });
                }
            }

            console.log('Step 2: Create Message');
            // 2. Create Message
            const message = await Message.create({
                conversationId: conversation.id,
                senderId,
                receiverId, // Optional but good for direct
                text,
                mediaUrl,
                mediaType,
                status: 'sent'
            }, { transaction });

            console.log('Step 3: Update Conversation');
            // 3. Update Conversation
            await conversation.update({
                lastMessageAt: new Date(),
                lastMessageId: message.id
            }, { transaction });

            console.log('Step 4: Upsert Attempt');
            // 4. Update/Create ConversationAttempt
            await ConversationAttempt.upsert({
                initiatorId: senderId,
                targetId: receiverId,
                lastAttemptedAt: new Date()
            }, { transaction });

            console.log('Step 5: Commit');
            await transaction.commit();
            console.log('Step 6: Done');

            return { message, conversation };
        } catch (err) {
            console.error('ChatService Error:', err);
            try {
                await transaction.rollback();
            } catch (rollbackErr) {
                console.error('Rollback Error:', rollbackErr);
            }
            throw err;
        }
    }

    async markAsRead(messageId, userId) {
        const message = await Message.findByPk(messageId);
        if (message && message.receiverId === userId && !message.readAt) {
            await message.update({
                status: 'read',
                readAt: new Date()
            });
            return message;
        }
        return null;
    }

    async getMessages(conversationId, limit = 50, offset = 0) {
        return await Message.findAll({
            where: { conversationId },
            order: [['createdAt', 'DESC']],
            limit,
            offset,
            include: [
                { model: User, as: 'Sender', attributes: ['id', 'username', 'profilePic'] }
            ]
        });
    }

    // ===== GROUP CHAT METHODS =====

    async createGroupConversation({ creatorId, memberIds, groupName, groupIcon }) {
        const { GroupMember } = require('../models');
        const transaction = await sequelize.transaction();

        try {
            // Create group conversation
            const conversation = await Conversation.create({
                type: 'group',
                groupName,
                groupIcon,
                createdBy: creatorId
            }, { transaction });

            // Add creator as admin
            await GroupMember.create({
                conversationId: conversation.id,
                userId: creatorId,
                role: 'admin'
            }, { transaction });

            // Add other members
            const memberPromises = memberIds
                .filter(id => id !== creatorId)
                .map(userId => GroupMember.create({
                    conversationId: conversation.id,
                    userId,
                    role: 'member'
                }, { transaction }));

            await Promise.all(memberPromises);
            console.log('Group members created in GroupMember table');

            // Also add to UserConversations for compatibility
            const allMemberIds = [creatorId, ...memberIds.filter(id => id !== creatorId)];
            try {
                await conversation.addUsers(allMemberIds, { transaction });
                console.log('Users added to UserConversations table');
            } catch (assocErr) {
                console.error('Failed to add users to UserConversations:', assocErr);
                throw assocErr;
            }

            await transaction.commit();
            return conversation;
        } catch (err) {
            await transaction.rollback();
            console.error('createGroupConversation transaction failed:', err);
            throw err;
        }
    }

    async addGroupMembers({ conversationId, memberIds, addedBy }) {
        const { GroupMember } = require('../models');
        const transaction = await sequelize.transaction();

        try {
            // Verify addedBy is an admin
            const adderMembership = await GroupMember.findOne({
                where: { conversationId, userId: addedBy }
            });

            if (!adderMembership || adderMembership.role !== 'admin') {
                throw new Error('Only admins can add members');
            }

            const conversation = await Conversation.findByPk(conversationId, { transaction });
            if (!conversation || conversation.type !== 'group') {
                throw new Error('Invalid group conversation');
            }

            // Add members
            const memberPromises = memberIds.map(userId =>
                GroupMember.create({
                    conversationId,
                    userId,
                    role: 'member'
                }, { transaction })
            );

            await Promise.all(memberPromises);
            await conversation.addUsers(memberIds, { transaction });

            await transaction.commit();
            return true;
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    async removeGroupMember({ conversationId, userId, removedBy }) {
        const { GroupMember } = require('../models');
        const transaction = await sequelize.transaction();

        try {
            // Verify removedBy is an admin
            const removerMembership = await GroupMember.findOne({
                where: { conversationId, userId: removedBy }
            });

            if (!removerMembership || removerMembership.role !== 'admin') {
                throw new Error('Only admins can remove members');
            }

            // Mark as left
            await GroupMember.update(
                { leftAt: new Date() },
                { where: { conversationId, userId }, transaction }
            );

            await transaction.commit();
            return true;
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    async leaveGroup({ conversationId, userId }) {
        const { GroupMember } = require('../models');

        await GroupMember.update(
            { leftAt: new Date() },
            { where: { conversationId, userId } }
        );

        return true;
    }

    async updateGroupInfo({ conversationId, groupName, groupIcon, updatedBy }) {
        const { GroupMember } = require('../models');

        // Verify updatedBy is an admin
        const membership = await GroupMember.findOne({
            where: { conversationId, userId: updatedBy }
        });

        if (!membership || membership.role !== 'admin') {
            throw new Error('Only admins can update group info');
        }

        const conversation = await Conversation.findByPk(conversationId);
        if (!conversation || conversation.type !== 'group') {
            throw new Error('Invalid group conversation');
        }

        await conversation.update({ groupName, groupIcon });
        return conversation;
    }

    async getGroupMembers({ conversationId }) {
        const { GroupMember } = require('../models');

        return await GroupMember.findAll({
            where: {
                conversationId,
                leftAt: null // Only active members
            },
            include: [
                { model: User, attributes: ['id', 'username', 'profilePic'] }
            ],
            order: [['role', 'DESC'], ['joinedAt', 'ASC']] // Admins first
        });
    }

    async deleteGroup({ conversationId, deletedBy }) {
        const { GroupMember } = require('../models');
        const transaction = await sequelize.transaction();

        try {
            // Verify deletedBy is an admin or creator
            const deleterMembership = await GroupMember.findOne({
                where: { conversationId, userId: deletedBy }
            });

            if (!deleterMembership || deleterMembership.role !== 'admin') {
                throw new Error('Only admins can delete the group');
            }

            const conversation = await Conversation.findByPk(conversationId, { transaction });
            if (!conversation || conversation.type !== 'group') {
                throw new Error('Invalid group conversation');
            }

            // Delete the conversation (cascade will delete messages, group members, etc.)
            await conversation.destroy({ transaction });

            await transaction.commit();
            return true;
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }
}

module.exports = new ChatService();
