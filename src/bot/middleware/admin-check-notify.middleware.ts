import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

import { checkAdminNotification } from '../../message';
import { logSkipMiddleware } from '../../utils';
import { onlyNotAdminFilter } from '../filters';
/**
 * Used for notifying admins about checking their messages
 * */
export async function adminCheckNotify(context: GrammyContext, next: NextFunction) {
  const isNotAdmin = await onlyNotAdminFilter(context);
  const { isCheckAdminNotified } = context.chatSession;
  const { isDeleted } = context.state;
  if (!isCheckAdminNotified && !isNotAdmin && isDeleted) {
    context.chatSession.isCheckAdminNotified = true;
    return context.replyWithSelfDestructedHTML(checkAdminNotification);
  }
  logSkipMiddleware(context, 'bot kicked or not admin', context.chatSession);
  return next();
}
