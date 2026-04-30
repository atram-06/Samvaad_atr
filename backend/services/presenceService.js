const { createClient } = require('redis');

let redisClient;

const initRedis = async () => {
    if (!redisClient) {
        redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
        redisClient.on('error', (err) => console.error('Redis Client Error', err));
        await redisClient.connect();
    }
    return redisClient;
};

const PRESENCE_TTL = 60; // 60 seconds

const PresenceService = {
    async setUserOnline(userId) {
        const client = await initRedis();
        const key = `presence:user:${userId}`;
        await client.set(key, 'online', { EX: PRESENCE_TTL });
    },

    async setUserOffline(userId) {
        const client = await initRedis();
        const key = `presence:user:${userId}`;
        await client.del(key);
    },

    async isUserOnline(userId) {
        const client = await initRedis();
        const key = `presence:user:${userId}`;
        const status = await client.get(key);
        return status === 'online';
    },

    async getOnlineUsers(userIds) {
        const client = await initRedis();
        const pipeline = client.multi();
        userIds.forEach(id => pipeline.get(`presence:user:${id}`));
        const results = await pipeline.exec();

        return userIds.reduce((acc, id, index) => {
            if (results[index] === 'online') {
                acc.push(id);
            }
            return acc;
        }, []);
    },

    async getOnlineStatusMap(userIds) {
        const client = await initRedis();
        const pipeline = client.multi();
        userIds.forEach(id => pipeline.get(`presence:user:${id}`));
        const results = await pipeline.exec();

        return userIds.reduce((acc, id, index) => {
            acc[id] = results[index] === 'online';
            return acc;
        }, {});
    },

    // Extend session (heartbeat)
    async heartbeat(userId) {
        return this.setUserOnline(userId);
    }
};

module.exports = PresenceService;
