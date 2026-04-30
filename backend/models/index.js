const { sequelize } = require('../db');
const User = require('./User');
const Post = require('./Post');
const Like = require('./Like');
const Comment = require('./Comment');
const Follow = require('./Follow');
const Message = require('./Message');
const Notification = require('./Notification');
const ConversationAttempt = require('./ConversationAttempt');
const Conversation = require('./Conversation');
const GroupMember = require('./GroupMember');
const Device = require('./Device');
const LoginActivity = require('./LoginActivity');
const UserHistory = require('./UserHistory');
const PostAnalytics = require('./PostAnalytics');
const SavedPost = require('./SavedPost');
const ChatbotConversation = require('./ChatbotConversation');

// Associations

// User & Post
User.hasMany(Post, { foreignKey: 'userId', onDelete: 'CASCADE' });
Post.belongsTo(User, { foreignKey: 'userId' });

// Likes
User.hasMany(Like, { foreignKey: 'userId', onDelete: 'CASCADE' });
Like.belongsTo(User, { foreignKey: 'userId' });
Post.hasMany(Like, { foreignKey: 'postId', onDelete: 'CASCADE' });
Like.belongsTo(Post, { foreignKey: 'postId' });

// Comments
User.hasMany(Comment, { foreignKey: 'userId', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'userId' });
Post.hasMany(Comment, { foreignKey: 'postId', onDelete: 'CASCADE' });
Comment.belongsTo(Post, { foreignKey: 'postId' });

// Follows
User.belongsToMany(User, { as: 'Followers', through: Follow, foreignKey: 'followingId' });
User.belongsToMany(User, { as: 'Following', through: Follow, foreignKey: 'followerId' });

// Messages & Conversations
User.belongsToMany(Conversation, { through: 'UserConversations' });
Conversation.belongsToMany(User, { through: 'UserConversations' });

Conversation.hasMany(Message, { foreignKey: 'conversationId', onDelete: 'CASCADE' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId' });

Message.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });
Message.belongsTo(User, { as: 'Receiver', foreignKey: 'receiverId' }); // Optional for group

Conversation.belongsTo(Message, { as: 'LastMessage', foreignKey: 'lastMessageId' });

// Conversation Attempts
User.hasMany(ConversationAttempt, { foreignKey: 'initiatorId', as: 'InitiatedAttempts' });
User.hasMany(ConversationAttempt, { foreignKey: 'targetId', as: 'ReceivedAttempts' });
ConversationAttempt.belongsTo(User, { foreignKey: 'initiatorId', as: 'Initiator' });
ConversationAttempt.belongsTo(User, { foreignKey: 'targetId', as: 'Target' });

// Notifications
User.hasMany(Notification, { foreignKey: 'userId', as: 'Notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'Recipient' });
Notification.belongsTo(User, { foreignKey: 'actorId', as: 'Actor' });

// Devices
User.hasMany(Device, { foreignKey: 'userId', onDelete: 'CASCADE' });
Device.belongsTo(User, { foreignKey: 'userId' });

// Login Activity
User.hasMany(LoginActivity, { foreignKey: 'userId', onDelete: 'CASCADE' });
LoginActivity.belongsTo(User, { foreignKey: 'userId' });

// User History
User.hasMany(UserHistory, { foreignKey: 'userId', onDelete: 'CASCADE' });
UserHistory.belongsTo(User, { foreignKey: 'userId' });
Post.hasMany(UserHistory, { foreignKey: 'postId', onDelete: 'CASCADE' });
UserHistory.belongsTo(Post, { foreignKey: 'postId' });

// Post Analytics
Post.hasMany(PostAnalytics, { foreignKey: 'postId', onDelete: 'CASCADE' });
PostAnalytics.belongsTo(Post, { foreignKey: 'postId' });

// Saved Posts
User.hasMany(SavedPost, { foreignKey: 'userId', onDelete: 'CASCADE' });
SavedPost.belongsTo(User, { foreignKey: 'userId' });
Post.hasMany(SavedPost, { foreignKey: 'postId', onDelete: 'CASCADE' });
SavedPost.belongsTo(Post, { foreignKey: 'postId' });

// Group Members
Conversation.hasMany(GroupMember, { foreignKey: 'conversationId', onDelete: 'CASCADE' });
GroupMember.belongsTo(Conversation, { foreignKey: 'conversationId' });
User.hasMany(GroupMember, { foreignKey: 'userId', onDelete: 'CASCADE' });
GroupMember.belongsTo(User, { foreignKey: 'userId' });

// Group Creator
Conversation.belongsTo(User, { as: 'Creator', foreignKey: 'createdBy' });

// Chatbot Conversations
User.hasMany(ChatbotConversation, { foreignKey: 'userId', onDelete: 'CASCADE' });
ChatbotConversation.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    sequelize,
    User,
    Post,
    Like,
    Comment,
    Follow,
    Message,
    Notification,
    Conversation,
    GroupMember,
    ConversationAttempt,
    Device,
    LoginActivity,
    UserHistory,
    PostAnalytics,
    SavedPost,
    ChatbotConversation
};
