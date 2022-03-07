const fs = require('fs');

const { handleError } = require('../../utils');
const { creatorId } = require('../../creator');

class SessionMiddleware {
  /**
   * @param {Date} startTime
   * */
  constructor(startTime) {
    this.startTime = startTime;
  }

  /**
   * Handle /session
   * Returns session file
   * */
  middleware() {
    /**
     * @param {TelegrafContext} ctx
     * */
    return (ctx) => {
      const chatId = ctx?.update?.message?.chat?.id;

      if (chatId === creatorId) {
        const sessionObjectBuffer = fs.readFileSync('./telegraf-session.json');
        ctx
          .replyWithDocument({ source: sessionObjectBuffer, filename: `telegraf-session-${this.startTime.toISOString()}.json` })
          .catch(handleError);
      }
    };
  }
}

module.exports = {
  SessionMiddleware,
};
