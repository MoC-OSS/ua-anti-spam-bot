import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { logSkipMiddleware } from '../../utils';

/**
 * Used for performance checking
 * */
export function botActiveMiddleware(context: GrammyContext, next: NextFunction) {
  // TODO use for ctx prod debug
  // console.info('enter botActiveMiddleware ******', ctx.chat?.title, '******', ctx.state.text);

  if (context.chat?.type !== 'private' && !context.chatSession.botRemoved && context.chatSession.isBotAdmin) {
    return next();
  }

  if (context.chat?.type === 'private') {
    return next();
  }

  logSkipMiddleware(context, 'bot kicked or not admin', context.chatSession);
}
