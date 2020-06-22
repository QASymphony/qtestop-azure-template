const winston = require('winston');
const { combine, timestamp, colorize } = winston.format;

const transformer = {
  transform: (info) => {
    if (info.message) {
      info[Symbol.for("message")] = `${info.timestamp} - [${info.level}]: ${info.message.replace('\n', '')}`;
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
    new winston.transports.File({
      format: logFormat,
      filename:  (__dirname + '/../app.log'),
      level: 'info'
    })
  ]
});