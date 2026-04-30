const winston = require('winston');
const LogstashTransport = require('winston-logstash-transport').LogstashTransport;

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Only add Logstash transport if host is explicitly defined
if (process.env.LOGSTASH_HOST) {
    logger.add(new LogstashTransport({
        host: process.env.LOGSTASH_HOST,
        port: process.env.LOGSTASH_PORT || 5000
    }));
    console.log(`Logstash transport enabled for ${process.env.LOGSTASH_HOST}:${process.env.LOGSTASH_PORT || 5000}`);
} else {
    console.log('Logstash transport disabled (LOGSTASH_HOST not set)');
}

module.exports = logger;
