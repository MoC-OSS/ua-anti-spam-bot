import type { GrammyContext, RedisSessionOptions } from '../../types';
import { RedisMiddleware } from '../middleware/redis.middleware';

export class RedisSession extends RedisMiddleware {
  constructor() {
    const _options: RedisSessionOptions = {
      property: 'session',
      state: {},
      format: {},
      getSessionKey: (context: GrammyContext): string => {
        if (!context.from) return ''; // should never happen
        let chatInstance: number | string;
        if (context.chat) {
          chatInstance = context.chat.id;
        } else if (context.callbackQuery) {
          chatInstance = context.callbackQuery.chat_instance || '';
        } else {
          chatInstance = context.from.id;
        }
        return `${chatInstance}:${context.from.id}`;
      },
    };
    super(_options);
  }
}
