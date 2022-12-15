import { adminReadyHasNoDeletePermissionMessage, getAdminReadyMessage, getStartChannelMessage } from '../../message';
import type { GrammyQueryMiddleware } from '../../types';
import { handleError } from '../../utils';

/**
 * Promoted to admin
 * */
export const botPromoteQuery: GrammyQueryMiddleware<'my_chat_member'> = async (context, next) => {
  if (context.myChatMember.new_chat_member.status === 'administrator') {
    if (context.chat.type === 'channel') {
      await context.replyWithHTML(getStartChannelMessage({ botName: context.me.username })).catch(handleError);
    } else {
      context.chatSession.botAdminDate = new Date();
      context.chatSession.isBotAdmin = true;
      context
        .replyWithHTML(
          context.myChatMember.new_chat_member.can_delete_messages
            ? getAdminReadyMessage({ botName: context.me.username })
            : adminReadyHasNoDeletePermissionMessage,
        )
        .catch(handleError);
    }
  }

  return next();
};
