import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { logSkipMiddleware } from '../../utils';
import { onlyNotAdminFilter } from '../filters';
/**
 * @description
 * Allow to execute next middlewares only if the user is not admin
 *
 * Reversed copy from
 * @see https://github.com/backmeupplz/grammy-middlewares/blob/main/src/middlewares/onlyAdmin.ts
 * */
export async function onlyNotAdmin(context: GrammyContext, next: NextFunction) {
  const isNotAdmin = await onlyNotAdminFilter(context);
  const isAdminCheckEnabled = context.chatSession.chatSettings.enableAdminCheck;
  if (isNotAdmin || isAdminCheckEnabled) {
    return next();
  }
  logSkipMiddleware(context, 'message is older than bot admin');
}
