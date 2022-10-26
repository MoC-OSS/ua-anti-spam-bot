import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { getDeclinedMassSendingMessage } from '../../message';
import { onlyCreatorFilter } from '../filters';

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
