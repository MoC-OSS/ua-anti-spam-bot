import { adminReadyHasNoDeletePermissionMessage, getAdminReadyMessage, getStartChannelMessage } from '@message';

import type { GrammyQueryMiddleware } from '@app-types/context';

import { handleError } from '@utils/error-handler';

/**
 * Promoted to admin
 * */
export const botPromoteQuery: GrammyQueryMiddleware<'my_chat_member'> = async (context, next) => {
  if (context.myChatMember.new_chat_member.status === 'administrator') {
    if (context.chat.type === 'channel') {
      await context.reply(getStartChannelMessage({ botName: context.me.username }), { parse_mode: 'HTML' }).catch(handleError);
    } else {
      context.chatSession.botAdminDate = new Date();
      context.chatSession.isBotAdmin = true;

      context
        .reply(
          context.myChatMember.new_chat_member.can_delete_messages
            ? getAdminReadyMessage({ botName: context.me.username })
            : adminReadyHasNoDeletePermissionMessage,
          { parse_mode: 'HTML' },
        )
        .catch(handleError);
    }
  }

  return next();
};
