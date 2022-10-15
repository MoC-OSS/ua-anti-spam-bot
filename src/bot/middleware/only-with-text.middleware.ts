import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { logSkipMiddleware } from '../../utils';

/**
 * @description
 * Skip messages without text
 * */
export function onlyWithText(context: GrammyContext, next: NextFunction) {
  const text = context.msg?.text || context.msg?.caption;

  if (text) {
    context.state.text = text;
    return next();
  }

  logSkipMiddleware(context, 'no text');
}
