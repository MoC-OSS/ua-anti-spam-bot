import type { NextFunction } from 'grammy';

import type { GrammyContext } from '@app-types/context';

import { logSkipMiddleware } from '@utils/generic.util';

/**
 * @description
 * Skip messages without text and add text into state
 * */
export function onlyWithText(context: GrammyContext, next: NextFunction) {
  if (context.state.text) {
    return next();
  }

  logSkipMiddleware(context, 'no text');

  // eslint-disable-next-line unicorn/no-useless-undefined
  return undefined;
}
