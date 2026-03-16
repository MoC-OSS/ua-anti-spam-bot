import type { NextFunction } from 'grammy';

import { onlyCreatorFilter } from '@bot/filters/only-creator.filter';

import type { GrammyContext } from '@app-types/context';

/**
 * Allow actions only for bot creator
 * @param context - The Grammy context object
 * @param next - The next middleware function in the chain
 * @returns A promise that resolves when the middleware chain completes
 */
export async function onlyCreator(context: GrammyContext, next: NextFunction) {
  if (onlyCreatorFilter(context)) {
    return next();
  }

  await context.reply(context.t('updates-declined'));

  // eslint-disable-next-line unicorn/no-useless-undefined
  return undefined;
}
