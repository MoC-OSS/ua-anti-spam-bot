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
    return (ctx) => {
      const startLocaleTime = formatDate(this.startTime);

      ctx.replyWithHTML(getHelpMessage({ startLocaleTime }));
    };
  }
}

module.exports = {
  HelpMiddleware,
};
