import { InputFile } from 'grammy';

import { creatorId } from '../../../creator';
import { redisClient } from '../../../db';
import type { GrammyMiddleware } from '../../../types';

export class SessionCommand {
  /**
   * @param {Date} startTime
   * */
  constructor(private startTime: Date) {}

  /**
   * Handle /session
   * Returns session file
   * */
  middleware(): GrammyMiddleware {
    /**
     * @param {GrammyContext} context
     * */
    return async (context) => {
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
