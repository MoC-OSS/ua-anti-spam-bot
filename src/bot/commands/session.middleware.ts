import { InputFile } from 'grammy';

import { creatorId } from '../../creator';
import { redisClient } from '../../db';
import type { GrammyContext } from '../../types';

export class SessionMiddleware {
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
    return async (context: GrammyContext) => {
      const chatId = context?.update?.message?.chat?.id;

      if (chatId === creatorId) {
        const sessions = await redisClient.getAllRecords();
        const sessionDocument = new InputFile(
          Buffer.from(JSON.stringify({ sessions }, null, 2)),
          `telegraf-session-${this.startTime.toISOString()}.json`,
        );
        await context.replyWithDocument(sessionDocument);
      }
    };
  }
}
