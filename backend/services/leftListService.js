const { User, Conversation, Message, ConversationAttempt, Follow, sequelize } = require('../models');
const { Op } = require('sequelize');

class LeftListService {
    async getLeftList(userId) {
        // 1. Get Followed Users
        const following = await Follow.findAll({
            where: { followerId: userId },
            attributes: ['followingId']
        });
        const followingIds = following.map(f => f.followingId);

        // 2. Get Attempted Chats (Initiated by me or Target is me)
        const attempts = await ConversationAttempt.findAll({
            where: {
                [Op.or]: [
                    { initiatorId: userId },
                    { targetId: userId }
                ]
            }
        });
        const attemptUserIds = attempts.map(a => a.initiatorId === userId ? a.targetId : a.initiatorId);

        // 3. Get all unique User IDs from (Following U Attempts)
        const allUserIds = [...new Set([...followingIds, ...attemptUserIds])];

        // 4. Fetch Direct Message Conversations
        let directChats = [];
        if (allUserIds.length > 0) {
            const users = await User.findAll({
                where: { id: { [Op.in]: allUserIds } },
                attributes: ['id', 'username', 'profilePic', 'fullname']
            });

            directChats = await Promise.all(users.map(async (user) => {
                const [results] = await sequelize.query(`
                    SELECT c.id, c."lastMessageAt", m.text as "lastMessageText", m."createdAt" as "messageTime",
                    (SELECT COUNT(*) FROM "Messages" WHERE "conversationId" = c.id AND "receiverId" = ${userId} AND "readAt" IS NULL) as "unreadCount"
                    FROM "Conversations" c
                    JOIN "UserConversations" uc1 ON uc1."conversationId" = c.id AND uc1."UserId" = ${userId}
                    JOIN "UserConversations" uc2 ON uc2."conversationId" = c.id AND uc2."UserId" = ${user.id}
                    LEFT JOIN "Messages" m ON c."lastMessageId" = m.id
                    WHERE c.type = 'direct'
                    LIMIT 1
                `);

                const convo = results[0];

                return {
                    type: 'direct',
                    user: {
                        id: user.id,
                        username: user.username,
                        profilePic: user.profilePic,
                        fullname: user.fullname
                    },
                    conversationId: convo ? convo.id : null,
                    lastMessage: convo ? convo.lastMessageText : null,
                    lastMessageAt: convo ? convo.messageTime : null,
                    unreadCount: convo ? parseInt(convo.unreadCount) : 0
                };
            }));
        }

        // 5. Fetch Group Conversations
        const { GroupMember } = require('../models');
        const groupMemberships = await GroupMember.findAll({
            where: {
                userId: userId,
                leftAt: null  // Only active memberships
            },
            attributes: ['conversationId']
        });

        const groupConversationIds = groupMemberships.map(gm => gm.conversationId);

        let groupChats = [];
        if (groupConversationIds.length > 0) {
            const groupConversations = await Conversation.findAll({
                where: {
                    id: { [Op.in]: groupConversationIds },
                    type: 'group'
                },
                include: [
                    {
                        model: Message,
                        as: 'LastMessage',
                        required: false,
                        attributes: ['text', 'createdAt']
                    }
                ],
                attributes: ['id', 'groupName', 'groupIcon', 'lastMessageAt']
            });

            groupChats = groupConversations.map(convo => ({
                type: 'group',
                conversationId: convo.id,
                groupName: convo.groupName,
                groupIcon: convo.groupIcon,
                lastMessage: convo.LastMessage ? convo.LastMessage.text : null,
                lastMessageAt: convo.LastMessage ? convo.LastMessage.createdAt : null,
                unreadCount: 0  // TODO: Implement unread count for groups
            }));
        }

        // 6. Combine and Sort by Recency
        const allChats = [...directChats, ...groupChats];
        allChats.sort((a, b) => {
            const timeA = new Date(a.lastMessageAt || 0).getTime();
            const timeB = new Date(b.lastMessageAt || 0).getTime();
            return timeB - timeA;
        });

        return allChats;
    }
}

module.exports = new LeftListService();
