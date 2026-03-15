import pino from 'pino';

const isLocal = process.env['ENV'] === 'local';

export const logger = pino({
  level: 'debug',
  ...(isLocal && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  }),
});
