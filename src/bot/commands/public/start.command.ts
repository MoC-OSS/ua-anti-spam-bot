import { getGroupStartMessage, getStartMessage } from '@message';

import type { GrammyMiddleware } from '@app-types/context';

import { handleError } from '@utils/error-handler.util';
import { getUserData } from '@utils/generic.util';
import { telegramUtility } from '@utils/util-instances.util';

export class StartCommand {
  /**
   * Handle /start
   * Returns help message
   * @returns The Grammy middleware function for /start.
   */
  middleware(): GrammyMiddleware {
    /**
     * Handles the /start command and replies with a welcome message.
     * @param context - Grammy bot context.
     * @returns A Promise that resolves when the reply has been sent.
     */
    // eslint-disable-next-line unicorn/consistent-function-scoping
    return async (context) => {
      if (context.chat?.type === 'private') {
        return context.reply(getStartMessage(context), { parse_mode: 'HTML' });
      }

      const isAdmin = context.chatSession.isBotAdmin;

      const canDelete = await context
        .deleteMessage()
        .then(() => true)
        .catch(() => false);

      const { writeUsername, userId } = getUserData(context);

      if (!isAdmin || !canDelete) {
        return context.replyWithSelfDestructedHTML(
          getGroupStartMessage(context, { isAdmin, canDelete, user: writeUsername === '@GroupAnonymousBot' ? '' : writeUsername, userId }),
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
              getGroupStartMessage(context, {
                adminsString,
                isAdmin,
                canDelete,
                user: writeUsername === '@GroupAnonymousBot' ? '' : writeUsername,
              }),
            )
            .catch(async (getAdminsError) => {
              handleError(getAdminsError);
              await context.reply(context.t('bot-make-admin'), { parse_mode: 'HTML' });
            });
        })
        .catch(handleError);
    };
  }
}
