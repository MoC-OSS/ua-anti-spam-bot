import type { NextFunction } from 'grammy';

import { onlyCreatorFilter } from '@bot/filters/only-creator.filter';

import { getDeclinedMassSendingMessage } from '@message';

import type { GrammyContext } from '@app-types/context';

/**
 * @description
 * Allow actions only for bot creator
 * */
export async function onlyCreator(context: GrammyContext, next: NextFunction) {
  if (onlyCreatorFilter(context)) {
    return next();
  }

  await context.reply(getDeclinedMassSendingMessage);

  // eslint-disable-next-line unicorn/no-useless-undefined
  return undefined;
}
