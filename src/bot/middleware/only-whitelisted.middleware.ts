import type { NextFunction } from 'grammy';

import type { GrammyContext } from '@app-types/context';

import { isIdWhitelisted } from '@utils/generic.util';

/**
 * Allow actions only for whitelisted users
 * @param context - The Grammy context object
 * @param next - The next middleware function in the chain
 * @returns A promise that resolves when the middleware chain completes
 */
export async function onlyWhitelisted(context: GrammyContext, next: NextFunction) {
  if (isIdWhitelisted(context.from?.id)) {
    return next();
  }

  await context.reply(context.t('updates-declined'));

  // eslint-disable-next-line unicorn/no-useless-undefined
  return undefined;
}
