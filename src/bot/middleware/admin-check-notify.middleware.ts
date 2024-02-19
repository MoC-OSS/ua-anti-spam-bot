import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { checkAdminNotification } from '../../message';
import { logSkipMiddleware } from '../../utils';
/**
 * Used for notifying admins about checking their messages
 * */
export async function adminCheckNotify(context: GrammyContext, next: NextFunction) {
  const { isCheckAdminNotified } = context.chatSession;
  const { isDeleted, isUserAdmin } = context.state;
  if (!isCheckAdminNotified && isUserAdmin && isDeleted) {
    context.chatSession.isCheckAdminNotified = true;
    return context.replyWithSelfDestructedHTML(checkAdminNotification);
  }
  logSkipMiddleware(context, 'bot kicked or not admin', context.chatSession);
  return next();
}
