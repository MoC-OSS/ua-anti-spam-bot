import type { NextFunction } from 'grammy';

import type { GrammyContext } from '@app-types/context';

import { logSkipMiddleware } from '@utils/generic.util';

/**
 * Allow to skip a forwarded message
 * @param context - The Grammy context object
 * @param next - The next middleware function in the chain
 * @returns A promise that resolves when the middleware chain completes
 */
export function onlyNotForwarded(context: GrammyContext, next: NextFunction) {
  // NOTE use for ctx prod debug
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
