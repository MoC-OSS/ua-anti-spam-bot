import { RedisMiddleware } from '@bot/middleware/redis.middleware';

import type { GrammyContext } from '@app-types/context';
import type { RedisSessionOptions } from '@app-types/session';

export class RedisChatSession extends RedisMiddleware {
  constructor() {
    const redisOptions: RedisSessionOptions = {
      property: 'chatSession',
      state: {},
      format: {},
      getSessionKey: (context: GrammyContext): string => {
        if (!context.from) {
          return '';
        } // should never happen

        let chatInstance: number | string;

        if (context.chat) {
          chatInstance = context.chat.id;
        } else if (context.callbackQuery) {
          chatInstance = context.callbackQuery.chat_instance || '';
        } else {
          chatInstance = context.from.id;
        }

        return `${chatInstance}`;
      },
    };

    super(redisOptions);
  }
}
