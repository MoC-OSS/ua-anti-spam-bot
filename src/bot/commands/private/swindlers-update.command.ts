import { getSwindlersUpdateEndMessage, getSwindlersUpdateStartMessage } from '@message/swindlers.message';

import type { DynamicStorageService } from '@services/dynamic-storage.service';

import type { GrammyContext } from '@app-types/context';

export class SwindlersUpdateCommand {
  /**
   * @param {DynamicStorageService} dynamicStorageService
   * */

  constructor(private dynamicStorageService: DynamicStorageService) {}

  /**
   * Handle /swindlers_update
   * */
  middleware() {
    /**
     * @param {GrammyContext} context
     * */
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
