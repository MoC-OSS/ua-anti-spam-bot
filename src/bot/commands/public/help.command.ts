import { getHelpMessage } from '@message';

import type { GrammyMiddleware } from '@app-types/context';

import { formatDate } from '@utils/date-format.util';
import { handleError } from '@utils/error-handler.util';
import { getUserData } from '@utils/generic.util';

export class HelpCommand {
  /**
   * Initializes the help command with the bot start time.
   * @param startTime - The time when the bot was started.
   */
  constructor(private startTime: Date) {}

  /**
   * Handle /help
   * Returns help message
   * @returns The Grammy middleware function for /help.
   */
  middleware(): GrammyMiddleware {
    /**
     * Handles the /help command and replies with bot usage information.
     * @param context - Grammy bot context.
     */
    // eslint-disable-next-line unicorn/consistent-function-scoping
    return async (context) => {
      const startLocaleTime = formatDate(this.startTime);

      const isAdmin = context.chatSession.isBotAdmin;
      const canDelete = Boolean(context.state.isDeleted);

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
            showAdminRoleHelp: context.chat?.type !== 'private' && Boolean(context.state.isActualUserAdmin),
            user: writeUsername === '@GroupAnonymousBot' ? '' : writeUsername,
            userId,
          }),
        )
        .catch(handleError);
    };
  }
}
