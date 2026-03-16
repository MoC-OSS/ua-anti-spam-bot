import { getSwindlersUpdateEndMessage, getSwindlersUpdateStartMessage } from '@message/swindlers.message';

import type { DynamicStorageService } from '@services/dynamic-storage.service';

import type { GrammyContext } from '@app-types/context';

export class SwindlersUpdateCommand {
  /**
   * Initializes the command with the dynamic storage service.
   * @param {DynamicStorageService} dynamicStorageService
   */

  constructor(private dynamicStorageService: DynamicStorageService) {}

  /**
   * Handle /swindlers_update
   * @returns The Grammy middleware function for /swindlers_update.
   */
  middleware() {
    /**
     * Handles the /swindlers_update command and refreshes the swindler storage.
     * @param context - Grammy bot context.
     */
    // eslint-disable-next-line unicorn/consistent-function-scoping
    return async (context: GrammyContext) => {
      await context.reply(getSwindlersUpdateStartMessage(context)).then(async (message) => {
        const chatId = context.chat?.id;

        if (!chatId) {
          return;
        }

        await this.dynamicStorageService
          .updateStorage()
          .then(() => context.api.editMessageText(chatId, message.message_id, getSwindlersUpdateEndMessage(context)));
      });
    };
  }
}
