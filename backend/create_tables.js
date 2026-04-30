const { sequelize, LoginActivity, UserHistory, PostAnalytics, SavedPost } = require('./models');

async function createMissingTables() {
    try {
        console.log('Creating missing tables...');

        // Create LoginActivities table
        await LoginActivity.sync({ force: false });
        console.log('✅ LoginActivities table ready');

        // Create UserHistories table
        await UserHistory.sync({ force: false });
        console.log('✅ UserHistories table ready');

        // Create PostAnalytics table
        await PostAnalytics.sync({ force: false });
        console.log('✅ PostAnalytics table ready');

        // Create SavedPosts table
        await SavedPost.sync({ force: false });
        console.log('✅ SavedPosts table ready');

        console.log('\n✅ All tables created successfully!');
        console.log('You can now use all new features.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
        process.exit(1);
    }
}

createMissingTables();
