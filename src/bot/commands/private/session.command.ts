import { InputFile } from 'grammy';

import * as redisClient from '@db/redis.client';

import type { GrammyMiddleware } from '@app-types/context';

import { creatorId } from '../../../creator';

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
    // eslint-disable-next-line unicorn/consistent-function-scoping
    return async (context) => {
      const chatId = context?.update?.message?.chat?.id;

      // eslint-disable-next-line sonarjs/different-types-comparison
      if (chatId === creatorId) {
        const sessions = await redisClient.getAllChatRecords();

        const sessionDocument = new InputFile(
          Buffer.from(JSON.stringify({ sessions }, null, 2)),
          `telegraf-chat-session-${this.startTime.toISOString()}.json`,
        );

        await context.replyWithDocument(sessionDocument);
      }
    };
  }
}
