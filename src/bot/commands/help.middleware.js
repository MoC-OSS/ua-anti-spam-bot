const { getHelpMessage } = require('../../message');
const { formatDate, handleError } = require('../../utils');

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
      let canDelete = false;

      try {
        canDelete = await ctx
          .deleteMessage()
          .then(() => true)
          .catch(() => false);
      } catch (e) {
        handleError(e);
      }

      const username = ctx.from?.username;
      const fullName = ctx.from?.last_name ? `${ctx.from?.first_name} ${ctx.from?.last_name}` : ctx.from?.first_name;
      const writeUsername = username ? `${username}` : fullName ?? '';
      const userId = ctx.from?.id;

      ctx
        .replyWithHTML(
          getHelpMessage({
            startLocaleTime,
            isAdmin,
            canDelete,
            user: writeUsername !== '@GroupAnonymousBot' ? writeUsername : '',
            userId,
          }),
        )
        .catch(handleError);
    };
  }
}

module.exports = {
  HelpMiddleware,
};
