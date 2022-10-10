import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { logSkipMiddleware } from '../../utils';

/**
 * @description
 * Skip messages before bot became admin
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
export function onlyWhenBotAdmin(context: GrammyContext, next: NextFunction) {
  if (context.chat?.type === 'private') {
    return next();
  }

  const isMessageAfterBotAdmin = (context.msg?.date || 0) * 1000 > +new Date(context.chatSession.botAdminDate);

  if (!context.chatSession.botRemoved && isMessageAfterBotAdmin) {
    return next();
  }

  logSkipMiddleware(context, 'message is older than bot admin');
}
