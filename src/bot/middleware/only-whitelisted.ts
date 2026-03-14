import type { NextFunction } from 'grammy';

import { getDeclinedMassSendingMessage } from '@message';

import type { GrammyContext } from '@app-types/context';

import { isIdWhitelisted } from '@utils/generic.util';

/**
 * @description
 * Allow actions only for whitelisted users
 * */
export async function onlyWhitelisted(context: GrammyContext, next: NextFunction) {
  if (isIdWhitelisted(context.from?.id)) {
    return next();
  }

  await context.reply(getDeclinedMassSendingMessage);

  // eslint-disable-next-line unicorn/no-useless-undefined
  return undefined;
}
