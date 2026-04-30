const { Queue } = require('bullmq');
const connection = require('../lib/redis');

const chatQueue = new Queue('chat-persistence', { connection });

module.exports = chatQueue;
