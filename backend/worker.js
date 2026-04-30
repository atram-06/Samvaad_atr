require('dotenv').config();
const { sequelize } = require('./models');
const chatWorker = require('./workers/chatWorker');

// Initialize DB and Worker
async function startWorker() {
    try {
        await sequelize.authenticate();
        console.log('Worker connected to Database.');

        console.log('Chat Worker started...');
        // The worker is already listening because we instantiated it in chatWorker.js

    } catch (err) {
        console.error('Worker failed to start:', err);
        process.exit(1);
    }
}

startWorker();
