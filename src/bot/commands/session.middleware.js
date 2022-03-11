const { redisClient } = require('../../db');

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
    return async (ctx) => {
      const chatId = ctx?.update?.message?.chat?.id;

      if (chatId === creatorId) {
        const sessions = await redisClient.getAllRecords();
        ctx.replyWithDocument({
          source: Buffer.from(JSON.stringify({ sessions })),
          filename: `telegraf-session-${this.startTime.toISOString()}.json`,
        });
      }
    };
  }
}

module.exports = {
  SessionMiddleware,
};
