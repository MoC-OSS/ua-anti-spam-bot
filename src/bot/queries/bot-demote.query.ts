import { memberReadyMessage } from '../../message';
import type { GrammyQueryMiddleware } from '../../types';
import { handleError } from '../../utils';

/**
 * Demoted to regular user
 * */
export const botDemoteQuery: GrammyQueryMiddleware<'my_chat_member'> = async (context, next) => {
  if (context.myChatMember.old_chat_member.status === 'administrator' && context.myChatMember.new_chat_member.status === 'member') {
    delete context.chatSession.botAdminDate;
    context.chatSession.isBotAdmin = false;
    context.reply(memberReadyMessage).catch(handleError);
  }

  return next();
};
