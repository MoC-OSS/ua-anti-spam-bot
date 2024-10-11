import { hydrateReply } from '@grammyjs/parse-mode';
import { Bot } from 'grammy';

import type { OutgoingRequests } from '../../../../testing';
import { MessagePrivateMockUpdate, prepareBotForTesting } from '../../../../testing';
import { mockChatSession } from '../../../../testing-main';
import type { GrammyContext } from '../../../../types';
import { logContextMiddleware, parseLocations, parseText, stateMiddleware } from '../../../middleware';
import { selfDestructedReply } from '../../../plugins';
import { getNoLocationsComposer } from '../no-locations.composer';
import {getNoChannelMessagesComposer} from "../no-channel-messages.composer";

let outgoingRequests: OutgoingRequests;
const { noChannelMessagesComposer } = getNoChannelMessagesComposer();
const bot = new Bot<GrammyContext>('mock');

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
    // bot.use(parseLocations);
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
      const update = new MessagePrivateMockUpdate({
        from: { id: 136817688, username: 'Channel_Bot' },
        sender_chat: { id: 12345 },
        reply_to_message: { sender_chat: { id: 54321 } },
      }).build();
      await bot.handleUpdate(update);

      const [deleteMessageRequest, getChatRequest, sendMessageRequest] = outgoingRequests.getAll<
        'deleteMessage',
        'getChat',
        'sendMessage',
        'sendMessage'
        >();

      expect(outgoingRequests.length).toEqual(4);
      expect(deleteMessageRequest?.method).toEqual('deleteMessage');
      expect(getChatRequest?.method).toEqual('getChat');
      expect(sendMessageRequest?.method).toEqual('sendMessage');
    });

    it('should not delete message if disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;
      const update = new MessagePrivateMockUpdate({
        from: { id: 136817688, username: 'Channel_Bot' },
        sender_chat: { id: 12345 },
        reply_to_message: { sender_chat: { id: 54321 } },
      }).build();
      await bot.handleUpdate(update);

      const [deleteMessageRequest, getChatRequest] = outgoingRequests.getAll<
        'deleteMessage',
        'getChat',
        'sendMessage'
        >();

      expect(outgoingRequests.length).toEqual(3);
      expect(deleteMessageRequest?.method).toEqual('deleteMessage');
      expect(getChatRequest?.method).toEqual('getChat');
    });

    it('should not delete message if sent by GroupAnonymousBot', async () => {
      const update = new MessagePrivateMockUpdate({
        from: { id: 136817688, username: 'GroupAnonymousBot' },
        sender_chat: { id: 12345 },
      }).build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });

    it('should not delete message from non-channel users', async () => {
      const update = new MessagePrivateMockUpdate({
        from: { id: 123456789, username: 'RegularUser' },
      }).build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
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
      const update = new MessagePrivateMockUpdate({
        from: { id: 136817688, username: 'Channel_Bot' },
        sender_chat: { id: 12345 },
      }).build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });
  });
});
