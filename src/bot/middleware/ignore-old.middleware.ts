import type { GrammyMiddleware } from '@app-types/context';

import { logger } from '@utils/logger.util';

/**
 * Short-circuits the middleware chain for messages older than the given threshold (default: 5 minutes).
 * Prevents the bot from processing stale messages after downtime or restarts.
 * @param threshold - Maximum age in seconds before a message is considered stale (default: 5 minutes)
 * @returns A Grammy middleware function that skips messages older than the threshold
 */
export const ignoreOld =
  (threshold = 5 * 60): GrammyMiddleware =>
  (context, next) => {
    const date = context.editedMessage?.edit_date || context.msg?.date;

    if (date && Date.now() / 1000 - date > threshold) {
      logger.info(
        `Ignoring message from user ${context.from?.id || '$unknown'} at chat ${context.chat?.id || '$unknown'} (${
          Date.now() / 1000
        }:${date})`,
      );

      // eslint-disable-next-line unicorn/no-useless-undefined
      return undefined;
    }

    return next();
  };
