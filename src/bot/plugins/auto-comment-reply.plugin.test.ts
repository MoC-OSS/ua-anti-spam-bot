import { Bot } from 'grammy';

import { LOGS_CHAT_THREAD_IDS, TELEGRAM_USER_ID } from '../../const';
import type { OutgoingRequests } from '../../testing';
import { MessageSuperGroupMockUpdate, prepareBotForTesting } from '../../testing';
import type { GrammyContext } from '../../types';

import { autoCommentReply } from './auto-comment-reply.plugin';

let outgoingRequests: OutgoingRequests;
let bot: Bot<GrammyContext>;

describe('autoCommentReply', () => {
  describe('replay into the same chat', () => {
    beforeAll(async () => {
      bot = new Bot<GrammyContext>('mock');
      bot.use(autoCommentReply());
      bot.on('message', (context) => context.api.sendMessage(context.msg.chat.id, context.msg.text || 'test'));
      outgoingRequests = await prepareBotForTesting<GrammyContext>(bot);
    }, 5000);

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should assign reply_to_message_id in case of replay to channel message', async () => {
      const updateConstructor = new MessageSuperGroupMockUpdate('test');
      const update = updateConstructor.buildOverwrite({
        message: {
          chat: updateConstructor.genericSuperGroup,
          reply_to_message: {
            message_id: updateConstructor.genericUpdateId,
            from: {
              id: TELEGRAM_USER_ID,
              is_bot: false,
              first_name: 'Telegram',
            },
            date: updateConstructor.genericSentDate,
            chat: updateConstructor.genericSuperGroup,
            reply_to_message: undefined,
          },
        },
      });

      await bot.handleUpdate(update);

      const apiCall = outgoingRequests.getLast<'sendMessage'>();

      expect(outgoingRequests.length).toEqual(1);
      expect(apiCall?.payload.reply_to_message_id).toBeDefined();
      expect(apiCall?.payload.reply_to_message_id).toEqual(update?.message?.reply_to_message?.message_id);
    });

    it('should not assign reply_to_message_id in case of not replay to channel message', async () => {
      const updateConstructor = new MessageSuperGroupMockUpdate('test');
      const update = updateConstructor.buildOverwrite({
        message: {
          chat: updateConstructor.genericSuperGroup,
          reply_to_message: {
            message_id: updateConstructor.genericUpdateId,
            from: updateConstructor.genericUserBot,
            date: updateConstructor.genericSentDate,
            chat: updateConstructor.genericSuperGroup,
            reply_to_message: undefined,
          },
        },
      });

      await bot.handleUpdate(update);

      const apiCall = outgoingRequests.getLast<'sendMessage'>();

      expect(outgoingRequests.length).toEqual(1);
      expect(apiCall?.payload.reply_to_message_id).toBeUndefined();
    });
  });

  describe('replay into different chat', () => {
    beforeAll(async () => {
      bot = new Bot<GrammyContext>('mock');
      bot.use(autoCommentReply());
      bot.on('message', (context) => context.api.sendMessage(LOGS_CHAT_THREAD_IDS.ANTI_RUSSIAN, context.msg.text || 'test'));
      outgoingRequests = await prepareBotForTesting<GrammyContext>(bot);
    }, 5000);

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should not assign reply_to_message_id in case of replay to channel message', async () => {
      const updateConstructor = new MessageSuperGroupMockUpdate('test');
      const update = updateConstructor.buildOverwrite({
        message: {
          chat: updateConstructor.genericSuperGroup,
          reply_to_message: {
            message_id: updateConstructor.genericUpdateId,
            from: {
              id: TELEGRAM_USER_ID,
              is_bot: false,
              first_name: 'Telegram',
            },
            date: updateConstructor.genericSentDate,
            chat: updateConstructor.genericSuperGroup,
            reply_to_message: undefined,
          },
        },
      });

      await bot.handleUpdate(update);

      const apiCall = outgoingRequests.getLast<'sendMessage'>();

      expect(outgoingRequests.length).toEqual(1);
      expect(apiCall?.payload.reply_to_message_id).toBeUndefined();
    });

    it('should not assign reply_to_message_id in case of not replay to channel message', async () => {
      const updateConstructor = new MessageSuperGroupMockUpdate('test');
      const update = updateConstructor.buildOverwrite({
        message: {
          chat: updateConstructor.genericSuperGroup,
          reply_to_message: {
            message_id: updateConstructor.genericUpdateId,
            from: updateConstructor.genericUserBot,
            date: updateConstructor.genericSentDate,
            chat: updateConstructor.genericSuperGroup,
            reply_to_message: undefined,
          },
        },
      });

      await bot.handleUpdate(update);

      const apiCall = outgoingRequests.getLast<'sendMessage'>();

      expect(outgoingRequests.length).toEqual(1);
      expect(apiCall?.payload.reply_to_message_id).toBeUndefined();
    });
  });
});
