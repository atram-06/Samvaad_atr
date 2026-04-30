const { ConversationAttempt, sequelize } = require('./models');

async function createAttempt() {
    try {
        const initiatorId = 10; // User 2
        const targetId = 1;     // User 1

        console.log(`Creating attempt from ${initiatorId} to ${targetId}...`);

        await ConversationAttempt.upsert({
            initiatorId,
            targetId,
            lastAttemptedAt: new Date()
        });

        console.log('ConversationAttempt created/updated.');
    } catch (err) {
        console.error('Error creating attempt:', err);
    }
}

createAttempt();
