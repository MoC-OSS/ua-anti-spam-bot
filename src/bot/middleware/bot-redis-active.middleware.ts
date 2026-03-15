import { redisService } from '@services/redis.service';

import type { GrammyMiddleware } from '@app-types/context';

import { logger } from '@utils/logger.util';

import { creatorId } from '../../creator';

/**
 * Short-circuits the middleware chain when the bot is deactivated via Redis.
 * Always allows messages through for the bot creator in private chat.
 */
export const botRedisActive: GrammyMiddleware = async (context, next) => {
  const isDeactivated = await redisService.getIsBotDeactivated();
  const isInLocal = context.chat?.type === 'private' && context.chat?.id === creatorId;

  if (!isDeactivated || isInLocal) {
    return next();
  }

  logger.info({ chatId: context.chat?.id }, 'Skip due to redis:');

  // eslint-disable-next-line unicorn/no-useless-undefined
  return undefined;
};
