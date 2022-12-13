import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { logSkipMiddleware } from '../../utils';
import { onlyWhenBotAdminFilter } from '../filters';

/**
 * @description
 * Skip messages before bot became admin
 * */
export function onlyWhenBotAdmin(context: GrammyContext, next: NextFunction) {
  const isBotAdmin = onlyWhenBotAdminFilter(context);

  if (isBotAdmin) {
    return next();
  }

  logSkipMiddleware(context, 'message is older than bot admin');
}
