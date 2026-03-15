import { InputFile } from 'grammy';

import * as redisClient from '@db/redis.client';

import type { GrammyMiddleware } from '@app-types/context';

import { creatorId } from '../../../creator';

export class SessionCommand {
  /**
   * Initializes the session command with the bot start time.
   * @param {Date} startTime
   * */
  constructor(private startTime: Date) {}

  /**
   * Handle /session
   * Returns session file
   * */
  middleware(): GrammyMiddleware {
    /**
     * Handles the /session command and replies with a session dump file.
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
