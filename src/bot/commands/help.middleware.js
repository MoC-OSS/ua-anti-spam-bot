const { getHelpMessage } = require('../../message');
const { handleError, formatDate } = require('../../utils');

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
     * @param {TelegrafContext} ctx
     * */
    return (ctx) => {
      const startLocaleTime = formatDate(this.startTime);

      ctx.replyWithHTML(getHelpMessage({ startLocaleTime })).catch(handleError);
    };
  }
}

module.exports = {
  HelpMiddleware,
};
