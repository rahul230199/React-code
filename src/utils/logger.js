const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Console logs
    new winston.transports.Console(),

    // Error logs
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),

    // Combined logs
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
});

module.exports = logger;
