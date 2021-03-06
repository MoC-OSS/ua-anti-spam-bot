const { swindlersUpdateStartMessage, swindlersUpdateEndMessage } = require('../../message');

class SwindlersUpdateMiddleware {
  /**
   * @param {DynamicStorageService} dynamicStorageService
   * */
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
    return async (ctx) => {
      ctx.reply(swindlersUpdateStartMessage).then((message) => {
        // eslint-disable-next-line camelcase
        const { message_id } = message;
        // eslint-disable-next-line camelcase
        this.dynamicStorageService.updateSwindlers().then(() => ctx.editMessageText(swindlersUpdateEndMessage, { message_id }));
      });
    };
  }
}

module.exports = {
  SwindlersUpdateMiddleware,
};
