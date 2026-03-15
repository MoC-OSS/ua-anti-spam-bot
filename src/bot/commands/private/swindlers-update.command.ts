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
        // eslint-disable-next-line camelcase
        const { message_id } = message;

        // @ts-ignore
        await this.dynamicStorageService
          .updateStorage()
          // eslint-disable-next-line camelcase
          .then(() => context.editMessageText(getSwindlersUpdateEndMessage(context), { message_id }));
      });
    };
  }
}
