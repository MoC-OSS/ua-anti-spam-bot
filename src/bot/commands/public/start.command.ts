import { getGroupStartMessage, getStartMessage, makeAdminMessage } from '../../../message';
import type { GrammyMiddleware } from '../../../types';
import { getUserData, handleError, telegramUtil } from '../../../utils';

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
    return async (context) => {
      if (context.chat?.type === 'private') {
        return context.replyWithHTML(getStartMessage());
      }

      const isAdmin = context.chatSession.isBotAdmin;
      const canDelete = await context
        .deleteMessage()
        .then(() => true)
        .catch(() => false);

      const { writeUsername, userId } = getUserData(context);

      if (!isAdmin || !canDelete) {
        return context.replyWithHTML(
          getGroupStartMessage({ isAdmin, canDelete, user: writeUsername === '@GroupAnonymousBot' ? '' : writeUsername, userId }),
        );
      }

      if (!context.chat?.id) {
        throw new Error('StartMiddleware error: chat.id is undefined');
      }

      return telegramUtil
        .getChatAdmins(context, context.chat?.id)
        .then(({ adminsString }) => {
          context
            .replyWithHTML(
              getGroupStartMessage({ adminsString, isAdmin, canDelete, user: writeUsername === '@GroupAnonymousBot' ? '' : writeUsername }),
            )
            .catch(async (getAdminsError) => {
              handleError(getAdminsError);
              await context.replyWithHTML(makeAdminMessage);
            });
        })
        .catch(handleError);
    };
  }
}
