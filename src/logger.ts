import winston from 'winston';
import path from 'path';

const logDir = path.resolve(__dirname, '..', 'data');

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}] ${message}${extra}`;
        }),
      ),
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'bot.log'),
      format: winston.format.combine(winston.format.json()),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 3,
    }),
  ],
});
