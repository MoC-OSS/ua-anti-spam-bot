import { getAdminReadyMessage, getStartChannelMessage } from '@message';

import type { GrammyQueryMiddleware } from '@app-types/context';

import { handleError } from '@utils/error-handler.util';

/**
 * Promoted to admin
 * @param context - Grammy query context for the my_chat_member update.
 * @param next - The next middleware function in the chain.
 * @returns A Promise that resolves when the middleware chain has been processed.
 */
export const botPromoteQuery: GrammyQueryMiddleware<'my_chat_member'> = async (context, next) => {
  if (context.myChatMember.new_chat_member.status === 'administrator') {
    if (context.chat.type === 'channel') {
      await context.reply(getStartChannelMessage(context, { botName: context.me.username }), { parse_mode: 'HTML' }).catch(handleError);
    } else {
      context.chatSession.botAdminDate = new Date();
      context.chatSession.isBotAdmin = true;

      context
        .reply(
          context.myChatMember.new_chat_member.can_delete_messages
            ? getAdminReadyMessage(context, { botName: context.me.username })
            : context.t('bot-admin-ready-no-delete'),
          { parse_mode: 'HTML' },
        )
        .catch(handleError);
    }
  }

  return next();
};
