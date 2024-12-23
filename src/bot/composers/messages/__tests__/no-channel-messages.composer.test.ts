import { hydrateReply } from '@grammyjs/parse-mode';
import { Bot } from 'grammy';

import type { OutgoingRequests } from '../../../../testing';
import { MessageMockUpdate, MessagePrivateMockUpdate, prepareBotForTesting } from '../../../../testing';
import { mockChatSession } from '../../../../testing-main';
import type { GrammyContext } from '../../../../types';
import { logContextMiddleware, parseText, stateMiddleware } from '../../../middleware';
import { selfDestructedReply } from '../../../plugins';
import { getNoChannelMessagesComposer } from '../no-channel-messages.composer';

let outgoingRequests: OutgoingRequests;
const { noChannelMessagesComposer } = getNoChannelMessagesComposer();
const bot = new Bot<GrammyContext>('mock');
const superGroupMockUpdate = new MessageMockUpdate('test');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({
  chatSettings: {
    enableDeleteChannelMessages: true,
    disableDeleteMessage: false,
  },
});

describe('noChannelMessagesComposer', () => {
  beforeAll(async () => {
    bot.use(hydrateReply);
    bot.use(selfDestructedReply());

    bot.use(stateMiddleware);
    bot.use(parseText);
    bot.use(logContextMiddleware);
    bot.use(mockChatSessionMiddleware);

    bot.use(noChannelMessagesComposer);

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, {
      getChat: {
        invite_link: '',
      },
    });
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteChannelMessages = true;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should delete message from a channel', async () => {
      const update = new MessageMockUpdate('Test').buildOverwrite({
        message: {
          from: { id: 136_817_688, username: 'Channel_Bot', is_bot: false, first_name: '' },
          sender_chat: { id: 12_345, type: 'channel', title: 'Another Channel' },
          reply_to_message: {
            sender_chat: { id: 54_321, type: 'channel', title: 'Main Channel' },
            message_id: 123,
            date: Date.now(),
            chat: superGroupMockUpdate.genericSuperGroup,
            reply_to_message: undefined,
          },
        },
      });

      await bot.handleUpdate(update);

      const [deleteMessageRequest, getChatRequest, sendMessageRequest] = outgoingRequests.getAll<
        'deleteMessage',
        'getChat',
        'sendMessage',
        'sendMessage'
      >();

      expect(outgoingRequests).toHaveLength(4);
      expect(getChatRequest?.method).toEqual('getChat');
      expect(deleteMessageRequest?.method).toEqual('deleteMessage');
      expect(sendMessageRequest?.method).toEqual('sendMessage');
    });

    it('should not delete message from the same channel', async () => {
      const update = new MessageMockUpdate('Test').buildOverwrite({
        message: {
          from: { id: 136_817_688, username: 'Channel_Bot', is_bot: false, first_name: '' },
          sender_chat: { id: 54_321, type: 'channel', title: 'Main Channel' },
          reply_to_message: {
            sender_chat: { id: 54_321, type: 'channel', title: 'Main Channel' },
            message_id: 123,
            date: Date.now(),
            chat: superGroupMockUpdate.genericSuperGroup,
            reply_to_message: undefined,
          },
        },
      });

      await bot.handleUpdate(update);

      expect(outgoingRequests).toHaveLength(0);
    });

    it('should delete message but not notify if disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;
      const update = new MessageMockUpdate('Test').buildOverwrite({
        message: {
          from: { id: 136_817_688, username: 'Channel_Bot', is_bot: false, first_name: '' },
          sender_chat: { id: 12_345, type: 'channel', title: 'Another Channel' },
          reply_to_message: {
            sender_chat: { id: 54_321, type: 'channel', title: 'Main Channel' },
            message_id: 123,
            date: Date.now(),
            chat: superGroupMockUpdate.genericSuperGroup,
            reply_to_message: undefined,
          },
        },
      });

      await bot.handleUpdate(update);

      const [deleteMessageRequest, getChatRequest] = outgoingRequests.getAll<'deleteMessage', 'getChat', 'sendMessage'>();

      expect(outgoingRequests).toHaveLength(3);
      expect(deleteMessageRequest?.method).toEqual('deleteMessage');
      expect(getChatRequest?.method).toEqual('getChat');
    });

    it('should not delete message if sent by GroupAnonymousBot', async () => {
      const update = new MessageMockUpdate('Test').buildOverwrite({
        message: {
          from: { id: 136_817_688, username: 'GroupAnonymousBot', is_bot: false, first_name: '' },
        },
        sender_chat: { id: 12_345 },
      });
      await bot.handleUpdate(update);

      expect(outgoingRequests).toHaveLength(0);
    });

    it('should not delete message from non-channel users', async () => {
      const update = new MessageMockUpdate('Test').buildOverwrite({
        message: {
          from: { id: 123_456_789, username: 'RegularUser', is_bot: false, first_name: '' },
        },
      });
      await bot.handleUpdate(update);

      expect(outgoingRequests).toHaveLength(0);
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteChannelMessages = false;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should not delete message from a channel when feature is disabled', async () => {
      const update = new MessagePrivateMockUpdate('Test').buildOverwrite({
        message: {
          from: { id: 136_817_688, username: 'Channel_Bot', is_bot: false, first_name: '' },
          sender_chat: { id: 12_345, type: 'channel', title: 'Another Channel' },
          reply_to_message: {
            sender_chat: { id: 54_321, type: 'channel', title: 'Main Channel' },
            message_id: 123,
            date: Date.now(),
            chat: superGroupMockUpdate.genericSuperGroup,
            reply_to_message: undefined,
          },
        },
      });
      await bot.handleUpdate(update);

      expect(outgoingRequests).toHaveLength(0);
    });

    it('should not delete message from the same channel', async () => {
      const update = new MessageMockUpdate('Test').buildOverwrite({
        message: {
          from: { id: 136_817_688, username: 'Channel_Bot', is_bot: false, first_name: '' },
          sender_chat: { id: 54_321, type: 'channel', title: 'Main Channel' },
          reply_to_message: {
            sender_chat: { id: 54_321, type: 'channel', title: 'Main Channel' },
            message_id: 123,
            date: Date.now(),
            chat: superGroupMockUpdate.genericSuperGroup,
            reply_to_message: undefined,
          },
        },
      });

      await bot.handleUpdate(update);

      expect(outgoingRequests).toHaveLength(0);
    });
  });
});
