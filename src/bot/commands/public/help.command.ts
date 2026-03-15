import { getHelpMessage } from '@message';

import type { GrammyMiddleware } from '@app-types/context';

import { formatDate } from '@utils/date-format.util';
import { handleError } from '@utils/error-handler.util';
import { getUserData } from '@utils/generic.util';

export class HelpCommand {
  /**
   * Initializes the help command with the bot start time.
   * @param {Date} startTime
   * */
  constructor(private startTime: Date) {}

  /**
   * Handle /help
   * Returns help message
   * */
  middleware(): GrammyMiddleware {
    /**
     * Handles the /help command and replies with bot usage information.
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
