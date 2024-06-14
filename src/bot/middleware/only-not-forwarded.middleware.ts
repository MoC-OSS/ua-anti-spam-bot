import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { logSkipMiddleware } from '../../utils';

/**
 * @description
 * Allow to skip a forwarded message
 * */
export function onlyNotForwarded(context: GrammyContext, next: NextFunction) {
  // TODO use for ctx prod debug
  // console.info('enter onlyNotForwarded ******', ctx.chat?.title, '******', ctx.state.text);

  /**
   * Skip forwarded messages
   * */
  if (context.update?.message?.forward_origin) {
    logSkipMiddleware(context, 'regular forward');
    return;
  }

  return next();
}
