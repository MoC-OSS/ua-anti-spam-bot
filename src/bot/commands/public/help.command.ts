import { getHelpMessage } from '@message';

import type { GrammyMiddleware } from '@app-types/context';

import { handleError } from '@utils/error-handler';
import { formatDate, getUserData } from '@utils/generic.util';

export class HelpCommand {
  /**
   * @param {Date} startTime
   * */
  constructor(private startTime: Date) {}

  /**
   * Handle /help
   * Returns help message
   * */
  middleware(): GrammyMiddleware {
    /**
     * @param {GrammyContext} context
     * */
    // eslint-disable-next-line unicorn/consistent-function-scoping
    return async (context) => {
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

      if (!userId) {
        throw new Error('Invalid user id');
      }

      context
        .replyWithSelfDestructedHTML(
          getHelpMessage(context, {
            startLocaleTime,
            isAdmin,
            canDelete,
            user: writeUsername === '@GroupAnonymousBot' ? '' : writeUsername,
            userId,
          }),
        )
        .catch(handleError);
    };
  }
}
