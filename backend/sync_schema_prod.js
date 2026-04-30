const { sequelize } = require('./models');

async function syncSchema() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Sync specific models
        const { Device, Message } = require('./models');

        console.log('Syncing Device model...');
        await Device.sync({ alter: true });

        console.log('Syncing Message model...');
        await Message.sync({ alter: true });

        console.log('Database schema synced successfully.');

        process.exit(0);
    } catch (err) {
        console.error('Unable to sync database:', err);
        process.exit(1);
    }
}

syncSchema();
