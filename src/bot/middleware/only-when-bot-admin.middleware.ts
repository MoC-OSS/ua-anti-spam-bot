import type { NextFunction } from 'grammy';

import { onlyWhenBotAdminFilter } from '@bot/filters/only-when-bot-admin.filter';

import type { GrammyContext } from '@app-types/context';

import { logSkipMiddleware } from '@utils/generic.util';

/**
 * Skip messages before bot became admin
 * @param context - The Grammy context object
 * @param next - The next middleware function in the chain
 * @returns A promise that resolves when the middleware chain completes
 */
export function onlyWhenBotAdmin(context: GrammyContext, next: NextFunction) {
  const isBotAdmin = onlyWhenBotAdminFilter(context);

  if (isBotAdmin) {
    return next();
  }

  logSkipMiddleware(context, 'message is older than bot admin');

  // eslint-disable-next-line unicorn/no-useless-undefined
  return undefined;
}
