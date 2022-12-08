import { swindlersUpdateEndMessage, swindlersUpdateStartMessage } from '../../../message';
import type { DynamicStorageService } from '../../../services';
import type { GrammyContext } from '../../../types';

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
    return async (context: GrammyContext) => {
      await context.reply(swindlersUpdateStartMessage).then(async (message) => {
        // eslint-disable-next-line camelcase
        const { message_id } = message;
        // eslint-disable-next-line camelcase,@typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line camelcase
        await this.dynamicStorageService.updateSwindlers().then(() => context.editMessageText(swindlersUpdateEndMessage, { message_id }));
      });
    };
  }
}
