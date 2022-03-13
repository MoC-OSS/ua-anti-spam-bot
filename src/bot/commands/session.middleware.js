const fs = require('fs');

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
     * @param {GrammyContext} ctx
     * */
    return (ctx) => {
      const chatId = ctx?.update?.message?.chat?.id;

      if (chatId === creatorId) {
        const sessionObjectBuffer = fs.readFileSync('./telegraf-session.json');
        ctx.replyWithDocument({ source: sessionObjectBuffer, filename: `telegraf-session-${this.startTime.toISOString()}.json` });
      }
    };
  }
}

module.exports = {
  SessionMiddleware,
};
