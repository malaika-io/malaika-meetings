var winston = require('winston');
var moment = require('moment');
const redisT = require('winston-redis');
var appRoot = require('app-root-path');

var redisTransport = winston.createLogger({
    level: 'info',
    transports: [
        new redisT()
    ]
});

var errorFileTransport = new winston.transports.File({
    filename: `${appRoot}/logs/app.log`,
    level: 'error',
    colorize: true,
    timestamp: function () {
        return moment.utc().format();
    },
    maxsize: 10000, // 10 KB
    maxFiles: 5,
    //formatter: function () {},
    tailable: true,
    zippedArchive: true
});

var logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            level: 'debug',
            colorize: true,
            timestamp: function () {
                return moment.utc().format();
            },
            json: true,
            prettyPrint: true,
            humanReadableUnhandledException: true,
        }),
        errorFileTransport,
        redisTransport
    ],
    exitOnError: false, // do not exit on handled exceptions
});

// logger hatası
logger.on('error', function (err) {
    console.error('Error occurred', err);
});

logger.stream = {
    write: function (message, encoding) {
        logger.info(message);
    },
};


module.exports.log = logger;
module.exports.loggerMiddleware = function (req, res, next) {
    req.logger = logger;
    next();
};
module.exports.exceptionMiddleware = function (err, req, res, next) {
    logger.error(err.message, {stack: err.stack});
    next(err);
};
module.exports.logAndCrash = function (err) {
    logger.error(err.message, {stack: err.stack});
    //throw err;
};
