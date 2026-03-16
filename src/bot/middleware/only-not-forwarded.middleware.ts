import type { NextFunction } from 'grammy';

import type { GrammyContext } from '@app-types/context';

import { logSkipMiddleware } from '@utils/generic.util';

/**
 * @param context
 * @param next
 * @description
 * Allow to skip a forwarded message
 */
export function onlyNotForwarded(context: GrammyContext, next: NextFunction) {
  // TODO use for ctx prod debug
  // console.info('enter onlyNotForwarded ******', ctx.chat?.title, '******', ctx.state.text);

  /**
   * Skip forwarded messages
   */
  if (context.update?.message?.forward_origin) {
    logSkipMiddleware(context, 'regular forward');

    // eslint-disable-next-line unicorn/no-useless-undefined
    return undefined;
  }

  return next();
}
