import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { logSkipMiddleware } from '../../utils';

/**
 * @description
 * Skip messages without ф photo
 * */
export function onlyWithPhoto(context: GrammyContext, next: NextFunction) {
  if (context.state.photo) {
    return next();
  }

  logSkipMiddleware(context, 'no photo');
}
