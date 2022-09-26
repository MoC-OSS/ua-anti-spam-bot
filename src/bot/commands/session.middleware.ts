import { GrammyContext } from '../../types';

const { InputFile } = require('grammy');

const { redisClient } = require('../../db');
const { creatorId } = require('../../creator');

class SessionMiddleware {
  /**
   * @param {Date} startTime
   * */
  startTime: Date;
  constructor(startTime: Date) {
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
    return async (ctx: GrammyContext) => {
      const chatId = ctx?.update?.message?.chat?.id;

      if (chatId === creatorId) {
        const sessions = await redisClient.getAllRecords();
        const sessionDocument = new InputFile(
          Buffer.from(JSON.stringify({ sessions }, null, 2)),
          `telegraf-session-${this.startTime.toISOString()}.json`,
        );
        ctx.replyWithDocument(sessionDocument);
      }
    };
  }
}

module.exports = {
  SessionMiddleware,
};
