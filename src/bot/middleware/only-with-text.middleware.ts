import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { logSkipMiddleware } from '../../utils';

/**
 * @description
 * Skip messages without text and add text into state
 * */
export function onlyWithText(context: GrammyContext, next: NextFunction) {
  const text = context.msg?.text || context.msg?.caption || context.msg?.poll?.question;

  if (text) {
    context.state.text = text;
    return next();
  }

  logSkipMiddleware(context, 'no text');
}
