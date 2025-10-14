import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.timestamp(), winston.format.simple())
    })
  ]
});

// morgan stream adapter
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};
