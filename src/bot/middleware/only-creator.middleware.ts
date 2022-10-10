import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { creatorId } from '../../creator';
import { getDeclinedMassSendingMessage } from '../../message';

/**
 * @description
 * Allow actions only for bot creator
 * */
export async function onlyCreator(context: GrammyContext, next: NextFunction) {
  if (context?.from?.id === creatorId) {
    return next();
  }

  await context.reply(getDeclinedMassSendingMessage);
}
