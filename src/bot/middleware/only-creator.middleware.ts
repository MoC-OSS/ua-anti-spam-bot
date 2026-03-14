import type { NextFunction } from 'grammy';

import type { GrammyContext } from 'types';

import { onlyCreatorFilter } from '@bot/filters';

import { getDeclinedMassSendingMessage } from '@message/';

/**
 * @description
 * Allow actions only for bot creator
 * */
export async function onlyCreator(context: GrammyContext, next: NextFunction) {
  if (onlyCreatorFilter(context)) {
    return next();
  }

  await context.reply(getDeclinedMassSendingMessage);
}
