import type { NextFunction } from 'grammy';

import type { GrammyContext } from '@app-types/context';

import { logSkipMiddleware } from '@utils/generic.util';

/**
 * Skip messages without a photo
 * @param context - The Grammy context object
 * @param next - The next middleware function in the chain
 * @returns A promise that resolves when the middleware chain completes
 */
export function onlyWithPhoto(context: GrammyContext, next: NextFunction) {
  if (context.state.photo) {
    return next();
  }

  logSkipMiddleware(context, 'no photo');

  // eslint-disable-next-line unicorn/no-useless-undefined
  return undefined;
}
