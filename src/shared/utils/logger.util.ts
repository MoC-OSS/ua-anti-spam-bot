import pino from 'pino';

import { environmentConfig } from '@shared/config';

const isLocal = environmentConfig.ENV === 'local';

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
