import type { GrammyQueryMiddleware } from '@app-types/context';

import { handleError } from '@utils/error-handler.util';

/**
 * Demoted to regular user
 * @param context
 * @param next
 */
export const botDemoteQuery: GrammyQueryMiddleware<'my_chat_member'> = async (context, next) => {
  if (context.myChatMember.old_chat_member.status === 'administrator' && context.myChatMember.new_chat_member.status === 'member') {
    delete context.chatSession.botAdminDate;
    context.chatSession.isBotAdmin = false;
    context.reply(context.t('bot-member-inactive')).catch(handleError);
  }

  return next();
};
