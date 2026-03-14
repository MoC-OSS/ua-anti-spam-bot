import type { NextFunction } from 'grammy';

import { onlyNotAdminFilter } from '@bot/filters/only-not-admin.filter';

import type { GrammyContext } from '@app-types/context';

import { logSkipMiddleware } from '@utils/generic.util';

/**
 * @description
 * Allow to execute next middlewares only if the user is not admin
 *
 * Reversed copy from
 * @see https://github.com/backmeupplz/grammy-middlewares/blob/main/src/middlewares/onlyAdmin.ts
 * */
export async function onlyNotAdmin(context: GrammyContext, next: NextFunction) {
  const isNotAdmin = onlyNotAdminFilter(context);
  const isAdminCheckEnabled = context.chatSession.chatSettings.enableAdminCheck;

  if (isNotAdmin || isAdminCheckEnabled) {
    return next();
  }

  logSkipMiddleware(context, 'message is older than bot admin');

  // eslint-disable-next-line unicorn/no-useless-undefined
  return undefined;
}
