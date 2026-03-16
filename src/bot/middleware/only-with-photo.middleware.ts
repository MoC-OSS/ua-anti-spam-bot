import type { NextFunction } from 'grammy';

import type { GrammyContext } from '@app-types/context';

import { logSkipMiddleware } from '@utils/generic.util';

/**
 * @param context
 * @param next
 * @description
 * Skip messages without ф photo
 */
export function onlyWithPhoto(context: GrammyContext, next: NextFunction) {
  if (context.state.photo) {
    return next();
  }

  logSkipMiddleware(context, 'no photo');

  // eslint-disable-next-line unicorn/no-useless-undefined
  return undefined;
}
