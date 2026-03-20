import { InputFile } from 'grammy';

import { creatorId } from '@bot/creator';

import * as redisClient from '@db/redis.client';

import type { GrammyMiddleware } from '@app-types/context';

export class SessionCommand {
  /**
   * Initializes the session command with the bot start time.
   * @param startTime - The time when the bot was started.
   */
  constructor(private startTime: Date) {}

  /**
   * Handle /session
   * Returns session file
   * @returns The Grammy middleware function for /session.
   */
  middleware(): GrammyMiddleware {
    /**
     * Handles the /session command and replies with a session dump file.
     * @param context - Grammy bot context.
     */
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
