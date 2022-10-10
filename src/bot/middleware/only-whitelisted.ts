import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { getDeclinedMassSendingMessage } from '../../message';
import { isIdWhitelisted } from '../../utils';

/**
 * @description
 * Allow actions only for whitelisted users
 * */
export async function onlyWhitelisted(context: GrammyContext, next: NextFunction) {
  if (isIdWhitelisted(context?.from?.id)) {
    return next();
  }

  await context.reply(getDeclinedMassSendingMessage);
}
