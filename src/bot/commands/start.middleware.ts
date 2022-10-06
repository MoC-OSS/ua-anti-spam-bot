import type { Bot } from 'grammy';

import { getGroupStartMessage, getStartMessage, makeAdminMessage } from '../../message';
import type { GrammyContext } from '../../types';
import { getUserData, handleError, telegramUtil } from '../../utils';

class StartMiddleware {
  /**
   * @param {Bot} bot
   * */
  bot: Bot;

  constructor(bot) {
    this.bot = bot;
  }

  /**
   * Handle /start
   * Returns help message
   *
   * */
  middleware() {
    /**
     * @param {GrammyContext} ctx
     * */
    return async (context: GrammyContext) => {
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
          getGroupStartMessage({ isAdmin, canDelete, user: writeUsername !== '@GroupAnonymousBot' ? writeUsername : '', userId }),
        );
      }

      return telegramUtil
        .getChatAdmins(this.bot, context.chat?.id)
        .then(({ adminsString }) => {
          context
            .replyWithHTML(
              getGroupStartMessage({ adminsString, isAdmin, canDelete, user: writeUsername !== '@GroupAnonymousBot' ? writeUsername : '' }),
            )
            .catch((getAdminsError) => {
              handleError(getAdminsError);
              context.replyWithHTML(makeAdminMessage);
            });
        })
        .catch(handleError);
    };
  }
}

module.exports = {
  StartMiddleware,
};
