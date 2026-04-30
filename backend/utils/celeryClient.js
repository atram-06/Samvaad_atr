const redis = require('redis');
const { v4: uuidv4 } = require('uuid');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/0';

// Create a Redis client for pushing tasks
const client = redis.createClient({
    url: REDIS_URL
});

client.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
    if (!client.isOpen) {
        await client.connect();
    }
})();

/**
 * Send a task to Celery
 * @param {string} taskName - Name of the task (e.g., 'tasks.add')
 * @param {Array} args - Positional arguments for the task
 * @param {Object} kwargs - Keyword arguments for the task
 */
async function sendTask(taskName, args = [], kwargs = {}) {
    const taskId = uuidv4();

    const message = {
        id: taskId,
        task: taskName,
        args: args,
        kwargs: kwargs,
        retries: 0,
        eta: null
    };

    // Celery expects the message to be pushed to the 'celery' list by default
    // The message must be JSON stringified and base64 encoded in some versions, 
    // but standard Celery JSON serializer just expects a JSON string.
    // However, Celery's default protocol is complex. 
    // A simpler way for Node -> Python is to use the 'celery' list directly with the correct body structure.

    // Standard Celery Message Protocol v2
    const payload = {
        body: Buffer.from(JSON.stringify([args, kwargs, null])).toString('base64'),
        content_encoding: 'utf-8',
        content_type: 'application/json',
        headers: {},
        properties: {
            correlation_id: taskId,
            reply_to: uuidv4(),
            delivery_mode: 2,
            delivery_info: {
                exchange: '',
                routing_key: 'celery'
            },
            priority: 0,
            body_encoding: 'base64',
            delivery_tag: uuidv4()
        }
    };

    await client.lPush('celery', JSON.stringify(payload));
    console.log(`Task ${taskName} sent with ID: ${taskId}`);
    return taskId;
}

module.exports = { sendTask };
