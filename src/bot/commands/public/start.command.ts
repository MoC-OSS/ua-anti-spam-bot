import { getGroupStartMessage, getStartMessage, makeAdminMessage } from '@message';

import type { GrammyMiddleware } from '@app-types/context';

import { handleError } from '@utils/error-handler';
import { getUserData } from '@utils/generic.util';
import { telegramUtility } from '@utils/util-instances';

export class StartCommand {
  /**
   * Handle /start
   * Returns help message
   *
   * */
  middleware(): GrammyMiddleware {
    /**
     * @param {GrammyContext} context
     * */
    // eslint-disable-next-line unicorn/consistent-function-scoping
    return async (context) => {
      if (context.chat?.type === 'private') {
        return context.reply(getStartMessage(), { parse_mode: 'HTML' });
      }

      const isAdmin = context.chatSession.isBotAdmin;

      const canDelete = await context
        .deleteMessage()
        .then(() => true)
        .catch(() => false);

      const { writeUsername, userId } = getUserData(context);

      if (!isAdmin || !canDelete) {
        return context.replyWithSelfDestructedHTML(
          getGroupStartMessage({ isAdmin, canDelete, user: writeUsername === '@GroupAnonymousBot' ? '' : writeUsername, userId }),
        );
      }

      if (!context.chat?.id) {
        throw new Error('StartMiddleware error: chat.id is undefined');
      }

      return telegramUtility
        .getChatAdmins(context, context.chat?.id)
        .then(({ adminsString }) => {
          context
            .replyWithSelfDestructedHTML(
              getGroupStartMessage({ adminsString, isAdmin, canDelete, user: writeUsername === '@GroupAnonymousBot' ? '' : writeUsername }),
            )
            .catch(async (getAdminsError) => {
              handleError(getAdminsError);
              await context.reply(makeAdminMessage, { parse_mode: 'HTML' });
            });
        })
        .catch(handleError);
    };
  }
}
