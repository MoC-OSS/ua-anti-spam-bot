import type { GrammyMiddleware } from '../../types';

export const ignoreOld =
  (threshold = 5 * 60): GrammyMiddleware =>
  (context, next) => {
    if (context.msg?.date && Date.now() / 1000 - context.msg.date > threshold) {
      console.info(
        `Ignoring message from user ${context.from?.id || '$unknown'} at chat ${context.chat?.id || '$unknown'} (${Date.now() / 1000}:${
          context.msg.date
        })`,
      );
      return;
    }

    return next();
  };
