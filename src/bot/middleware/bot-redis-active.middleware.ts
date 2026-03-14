import { redisService } from '@services/redis.service';

import type { GrammyMiddleware } from '@app-types/context';

import { creatorId } from '../../creator';

export const botRedisActive: GrammyMiddleware = async (context, next) => {
  const isDeactivated = await redisService.getIsBotDeactivated();
  const isInLocal = context.chat?.type === 'private' && context.chat?.id === creatorId;

  if (!isDeactivated || isInLocal) {
    return next();
  }

  console.info('Skip due to redis:', context.chat?.id);

  // eslint-disable-next-line unicorn/no-useless-undefined
  return undefined;
};
