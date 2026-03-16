import type { NextFunction } from 'grammy';

import type { GrammyContext } from '@app-types/context';

import { logSkipMiddleware } from '@utils/generic.util';

/**
 * Skip messages without text and add text into state
 * @param context - The Grammy context object
 * @param next - The next middleware function in the chain
 * @returns A promise that resolves when the middleware chain completes
 */
export function onlyWithText(context: GrammyContext, next: NextFunction) {
  if (context.state.text) {
    return next();
  }

  logSkipMiddleware(context, 'no text');

  // eslint-disable-next-line unicorn/no-useless-undefined
  return undefined;
}
