const { getHelpMessage } = require('../../message');
const { formatDate } = require('../../utils');

class HelpMiddleware {
  /**
   * @param {Date} startTime
   * */
  constructor(startTime) {
    this.startTime = startTime;
  }

  /**
   * Handle /help
   * Returns help message
   * */
  middleware() {
    /**
     * @param {GrammyContext} ctx
     * */
    return async (ctx) => {
      const startLocaleTime = formatDate(this.startTime);

      const isAdmin = ctx.chatSession.isBotAdmin;
      const canDelete = await ctx
        .deleteMessage()
        .then(() => true)
        .catch(() => false);

      ctx.replyWithHTML(getHelpMessage({ startLocaleTime, isAdmin, canDelete }));
    };
  }
}

module.exports = {
  HelpMiddleware,
};
