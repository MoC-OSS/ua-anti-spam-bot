import type { NextFunction } from 'grammy';

import { onlyCreatorFilter } from '@bot/filters/only-creator.filter';

import type { GrammyContext } from '@app-types/context';

/**
 * @param context
 * @param next
 * @description
 * Allow actions only for bot creator
 */
export async function onlyCreator(context: GrammyContext, next: NextFunction) {
  if (onlyCreatorFilter(context)) {
    return next();
  }

  await context.reply(context.t('updates-declined'));

  // eslint-disable-next-line unicorn/no-useless-undefined
  return undefined;
}
