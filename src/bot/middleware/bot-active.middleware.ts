import type { NextFunction } from 'grammy';

import type { GrammyContext } from '@app-types/context';

import { logSkipMiddleware } from '@utils/generic.util';

/**
 * Used for performance checking
 * @param context - The Grammy context object
 * @param next - The next middleware function in the chain
 * @returns A promise that resolves when the middleware chain completes
 */
export function botActiveMiddleware(context: GrammyContext, next: NextFunction) {
  // NOTE use for ctx prod debug
  // console.info('enter botActiveMiddleware ******', ctx.chat?.title, '******', ctx.state.text);

  if (context.chat?.type !== 'private' && !context.chatSession.botRemoved && context.chatSession.isBotAdmin) {
    return next();
  }

  if (context.chat?.type === 'private') {
    return next();
  }

  logSkipMiddleware(context, 'bot kicked or not admin', context.chatSession);

  // eslint-disable-next-line unicorn/no-useless-undefined
  return undefined;
}
