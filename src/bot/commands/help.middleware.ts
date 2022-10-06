import { getHelpMessage } from '../../message';
import type { GrammyContext } from '../../types';
import { formatDate, getUserData, handleError } from '../../utils';

class HelpMiddleware {
  /**
   * @param {Date} startTime
   * */
  constructor(private startTime: Date) {}

  /**
   * Handle /help
   * Returns help message
   * */
  middleware() {
    /**
     * @param {GrammyContext} ctx
     * */
    return async (context: GrammyContext) => {
      const startLocaleTime = formatDate(this.startTime);

      const isAdmin = context.chatSession.isBotAdmin;
      let canDelete = false;

      try {
        canDelete = await context
          .deleteMessage()
          .then(() => true)
          .catch(() => false);
      } catch (error) {
        handleError(error);
      }

      const { writeUsername, userId } = getUserData(context);

      context
        .replyWithHTML(
          getHelpMessage({
            startLocaleTime,
            isAdmin,
            canDelete,
            user: writeUsername !== '@GroupAnonymousBot' ? writeUsername : '',
            userId,
          }),
        )
        .catch(handleError);
    };
  }
}

module.exports = {
  HelpMiddleware,
};
