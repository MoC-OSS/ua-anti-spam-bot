import type { Channel, Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { getNoChannelMessagesComposer } from '@bot/composers/messages/no-channel-messages.composer';
import { i18n } from '@bot/i18n';
import { logContextMiddleware } from '@bot/middleware/log-context.middleware';
import { parseText } from '@bot/middleware/parse-text.middleware';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession } from '@test-helpers/session-mocks';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;
let senderChannel: Channel<GrammyContext>;
let sameChannel: Channel<GrammyContext>;

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
    bot.use(i18n);
    bot.use(selfDestructedReply());

    bot.use(stateMiddleware);
    bot.use(parseText);
    bot.use(logContextMiddleware);
    bot.use(mockChatSessionMiddleware);

    bot.use(noChannelMessagesComposer);

    ({ chats } = await prepareBot<GrammyContext>(bot));

    user = chats.newUser();
    group = chats.newSupergroup();
    senderChannel = chats.newChannel();
    sameChannel = chats.newChannel({ id: 54_321, title: 'Same Channel' });
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteChannelMessages = true;
    });

    beforeEach(() => {
      chats.clear();
    });

    it('should delete message from a channel', async () => {
      await senderChannel.postMessageTo(group, 'Test');

      expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['deleteMessage', 'getChat', 'sendMessage', 'sendMessage']));
      expect(chats.deletionsFor(group).length).toEqual(1);
    });

    it('should not delete message from the same channel', async () => {
      await sameChannel.postMessageTo(group, 'Test', {
        reply_to_message: { sender_chat: sameChannel.toTelegramChat(), message_id: 123 },
      });

      expect(chats.outgoing).toHaveLength(0);
    });

    it('should delete message but not notify if disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;

      await senderChannel.postMessageTo(group, 'Test');

      expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['deleteMessage', 'getChat', 'sendMessage']));
      expect(chats.deletionsFor(group).length).toEqual(1);
    });

    it('should not delete message if sent by Channel_Bot without sender_chat', async () => {
      // Channel_Bot (from.id === 136_817_688) with no sender_chat → senderChatId and parentChannelId
      // are both undefined, so senderChatId === parentChannelId is true → next() is called, no deletion
      const channelBotUser = chats.newUser({ id: 136_817_688, username: 'Channel_Bot' });

      await channelBotUser.sendText('Test', { chat: group });

      expect(chats.outgoing).toHaveLength(0);
    });

    it('should not delete message from non-channel users', async () => {
      await user.sendText('Test', { chat: group });

      expect(chats.outgoing).toHaveLength(0);
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteChannelMessages = false;
    });

    beforeEach(() => {
      chats.clear();
    });

    it('should not delete message from a channel when feature is disabled', async () => {
      await senderChannel.postMessageTo(group, 'Test');

      expect(chats.outgoing).toHaveLength(0);
    });

    it('should not delete message from the same channel', async () => {
      await sameChannel.postMessageTo(group, 'Test', {
        reply_to_message: { sender_chat: sameChannel.toTelegramChat(), message_id: 123 },
      });

      expect(chats.outgoing).toHaveLength(0);
    });
  });
});
