const { Conversation, User, sequelize } = require('./models');

async function createConversation() {
    const transaction = await sequelize.transaction();
    try {
        const user1Id = 1;
        const user2Id = 10; // Based on check_users output

        // Check if exists
        const [results] = await sequelize.query(`
            SELECT "conversationId" FROM "UserConversations" WHERE "UserId" IN (${user1Id}, ${user2Id})
            GROUP BY "conversationId"
            HAVING COUNT(DISTINCT "UserId") = 2
        `);

        if (results.length > 0) {
            console.log('Conversation already exists:', results[0].conversationId);
            return;
        }

        console.log('Creating new conversation...');
        const conversation = await Conversation.create({ type: 'direct' }, { transaction });
        await conversation.addUsers([user1Id, user2Id], { transaction });

        await transaction.commit();
        console.log('Conversation created with ID:', conversation.id);
    } catch (err) {
        await transaction.rollback();
        console.error('Error creating conversation:', err);
    }
}

createConversation();
