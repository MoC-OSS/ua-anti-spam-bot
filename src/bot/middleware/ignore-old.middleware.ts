import type { GrammyMiddleware } from '@app-types/context';

export const ignoreOld =
  (threshold = 5 * 60): GrammyMiddleware =>
  (context, next) => {
    const date = context.editedMessage?.edit_date || context.msg?.date;

    if (date && Date.now() / 1000 - date > threshold) {
      console.info(
        `Ignoring message from user ${context.from?.id || '$unknown'} at chat ${context.chat?.id || '$unknown'} (${
          Date.now() / 1000
        }:${date})`,
      );

      // eslint-disable-next-line unicorn/no-useless-undefined
      return undefined;
    }

    return next();
  };
