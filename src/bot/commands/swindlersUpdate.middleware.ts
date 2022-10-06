import { swindlersUpdateEndMessage, swindlersUpdateStartMessage } from '../../message';
import type { DynamicStorageService } from '../../services/dynamic-storage.service';

export class SwindlersUpdateMiddleware {
  /**
   * @param {DynamicStorageService} dynamicStorageService
   * */
  dynamicStorageService: DynamicStorageService;

  constructor(dynamicStorageService) {
    this.dynamicStorageService = dynamicStorageService;
  }

  /**
   * Handle /swindlers_update
   * */
  middleware() {
    /**
     * @param {GrammyContext} ctx
     * */
    return async (context) => {
      context.reply(swindlersUpdateStartMessage).then((message) => {
        // eslint-disable-next-line camelcase
        const { message_id } = message;
        // eslint-disable-next-line camelcase
        this.dynamicStorageService.updateSwindlers().then(() => context.editMessageText(swindlersUpdateEndMessage, { message_id }));
      });
    };
  }
}
