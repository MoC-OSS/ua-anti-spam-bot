import { creatorId } from '../../creator';
import { redisService } from '../../services';
import type { GrammyMiddleware } from '../../types';

export const botRedisActive: GrammyMiddleware = async (context, next) => {
  const isDeactivated = await redisService.getIsBotDeactivated();
  const isInLocal = context.chat?.type === 'private' && context.chat?.id === creatorId;

  if (!isDeactivated || isInLocal) {
    return next();
  }

  console.info('Skip due to redis:', context.chat?.id);
};
