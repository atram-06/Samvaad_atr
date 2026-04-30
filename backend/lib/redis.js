const { Redis } = require('ioredis');

const redisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null
};

let connection;
if (process.env.REDIS_URL) {
    connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
} else {
    connection = new Redis(redisOptions);
}

module.exports = connection;
