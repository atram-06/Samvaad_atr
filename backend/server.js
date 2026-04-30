const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('redis');
const client = require('prom-client');
const { sequelize } = require('./models');

// Security middleware
const { apiLimiter, authLimiter, chatbotLimiter, uploadLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const postsRouter = require('./routes/posts');
const videosRouter = require('./routes/videos');
const authRouter = require('./routes/auth');
const historyRouter = require('./routes/history');

dotenv.config();

const http = require('http');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app); // Create HTTP server

const PORT = process.env.PORT || 3001;

// Redis Client
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: false
    }
});

redisClient.on('error', (err) => {
    if (process.env.REDIS_ENABLED === 'true') {
        logger.error('Redis Client Error', err);
    }
});

(async () => {
    if (process.env.REDIS_ENABLED === 'true') {
        try {
            await redisClient.connect();
            logger.info('Connected to Redis');
        } catch (err) {
            logger.error('Failed to connect to Redis, caching disabled');
        }
    } else {
        logger.info('Redis disabled by configuration');
    }
})();

// Prometheus Metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 0.5, 1, 1.5, 2, 5]
});

const logger = require('./utils/logger');

// Middleware to measure request duration
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        end({ method: req.method, route: req.route ? req.route.path : req.path, code: res.statusCode });
        logger.info(`Finished ${req.method} ${req.url} - ${res.statusCode}`);
    });
    next();
});

// Middleware
app.use(cors({
    origin: true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' })); // Add size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Apply global rate limiter to all API routes
app.use('/api/', apiLimiter);

// Make redisClient available to routes
app.use((req, res, next) => {
    req.redisClient = redisClient;
    next();
});

// Routes with specific rate limiters
app.use('/api/auth', authRouter); // Auth limiter applied in routes
app.use('/api/posts', postsRouter);
app.use('/api/videos', videosRouter);
app.use('/api/history', historyRouter);
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/users', require('./routes/users'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chatbot', require('./routes/chatbot')); // Chatbot limiter applied in routes

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

app.get('/', (req, res) => {
    res.send('Social Media Backend is running');
});

// 404 handler - must be after all routes
app.use(notFound);

// Global Error Handler - must be last
app.use(errorHandler);

// Sync DB and start server
(async () => {
    try {
        // Initialize Socket.IO first
        const io = await initSocket(server);

        // Make io available to routes via req
        app.use((req, res, next) => {
            req.io = io;
            next();
        });

        // Sync database
        await sequelize.sync();
        logger.info('Database synced successfully');

        // Start server
        server.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.info('Socket.IO initialized and ready');
        });
    } catch (err) {
        logger.error('Failed to start server:', err);
        process.exit(1);
    }
})();

