import type { NextFunction } from 'grammy';

import { checkAdminNotification } from '@message/admin.message';

import type { GrammyContext, GrammyMiddleware } from '@app-types/context';

import { logSkipMiddleware } from '@utils/generic.util';

/**
 * Used for notifying admins about checking their messages
 * */
export const adminCheckNotify: GrammyMiddleware = async (context: GrammyContext, next: NextFunction) => {
  const { isCheckAdminNotified } = context.chatSession;
  const { isDeleted, isUserAdmin } = context.state;
  const isChatNotPrivate = context.chat?.type !== 'private';

  if (!isCheckAdminNotified && isUserAdmin && isDeleted && isChatNotPrivate) {
    return context.replyWithSelfDestructedHTML(checkAdminNotification as string);
  }

  logSkipMiddleware(context, 'bot kicked or not admin', context.chatSession);

  return next();
};
