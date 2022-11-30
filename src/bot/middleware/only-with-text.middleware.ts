import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { logSkipMiddleware } from '../../utils';

/**
 * @description
 * Skip messages without text and add text into state
 * */
export function onlyWithText(context: GrammyContext, next: NextFunction) {
  if (context.state.text) {
    return next();
  }

  logSkipMiddleware(context, 'no text');
}
