const winston = require('winston');
require('winston-daily-rotate-file');
const package = require('../package.json')

const { combine, timestamp, colorize } = winston.format;

const transformer = {
  transform: (info) => {
    if (info.message) {
      info[Symbol.for("message")] = `${info.timestamp} - [${package.name}] [${info.level}]: ${info.message.replace('\n', '')}`;
    }
    return info;
  }
};

const logFormat = combine(timestamp(), transformer);
const consoleFormat = combine(colorize(), logFormat);

exports.logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
      level: 'info',
      handleExceptions: true
    }),
    new winston.transports.DailyRotateFile({
      format: logFormat,
      level: 'info',
      filename: (__dirname + '/../logs/'+ 'update-ip-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});