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

const { noChannelMessagesComposer } = getNoChannelMessagesComposer();
const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({
  chatSettings: {
    enableDeleteChannelMessages: true,
    disableDeleteMessage: false,
  },
});

interface BuildChannelUpdateOverridesFrom {
  id: number;
  username?: string;
}

interface BuildChannelUpdateOverrides {
  from: BuildChannelUpdateOverridesFrom;
  senderChatId: number;
  replySenderChatId: number;
}

/**
 * Builds a raw update using the registered group's chat ID so deletions route correctly.
 * @param groupId
 * @param overrides
 * @param overrides.from
 * @param overrides.from.id
 * @param overrides.from.username
 * @param overrides.senderChatId
 * @param overrides.replySenderChatId
 */
function buildChannelUpdate(groupId: number, overrides: BuildChannelUpdateOverrides) {
  return {
    update_id: 1,
    message: {
      message_id: 1,
      date: Math.floor(Date.now() / 1000),
      text: 'Test',
      chat: { id: groupId, type: 'supergroup' as const, title: 'Test Group' },
      from: { id: overrides.from.id, is_bot: false, first_name: '', username: overrides.from.username },
      sender_chat: { id: overrides.senderChatId, type: 'channel' as const, title: 'Another Channel' },
      reply_to_message: {
        sender_chat: { id: overrides.replySenderChatId, type: 'channel' as const, title: 'Main Channel' },
        message_id: 123,
        date: Math.floor(Date.now() / 1000),
        chat: { id: groupId, type: 'supergroup' as const, title: 'Test Group' },
        reply_to_message: undefined,
      },
    },
  };
}

describe('noChannelMessagesComposer', () => {
  beforeAll(async () => {
    bot.use(i18n);
    bot.use(selfDestructedReply());

    bot.use(stateMiddleware);
    bot.use(parseText);
    bot.use(logContextMiddleware);
    bot.use(mockChatSessionMiddleware);

    bot.use(noChannelMessagesComposer);

    ({ chats } = await prepareBot<GrammyContext>(bot, {
      responses: {
        getChat: {
          invite_link: '',
        },
      },
    }));

    user = chats.newUser();
    group = chats.newSupergroup();
    senderChannel = chats.newChannel();
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteChannelMessages = true;
    });

    beforeEach(() => {
      chats.outgoing.clear();
      user.replies.clear();
      chats.deletionsFor(group).clear();
    });

    it('should delete message from a channel', async () => {
      await senderChannel.postMessageTo(group, 'Test');

      const [deleteMessageRequest, getChatRequest, sendMessageRequest] = chats.outgoing.getAll<
        'deleteMessage',
        'getChat',
        'sendMessage',
        'sendMessage'
      >();

      expect(chats.outgoing).toHaveLength(4);
      expect(getChatRequest?.method).toEqual('getChat');
      expect(deleteMessageRequest?.method).toEqual('deleteMessage');
      expect(sendMessageRequest?.method).toEqual('sendMessage');
      expect(chats.deletionsFor(group).length).toEqual(1);
    });

    it('should not delete message from the same channel', async () => {
      await bot.handleUpdate(
        buildChannelUpdate(group.id, {
          from: { id: 136_817_688, username: 'Channel_Bot' },
          senderChatId: 54_321,
          replySenderChatId: 54_321,
        }),
      );

      expect(chats.outgoing).toHaveLength(0);
    });

    it('should delete message but not notify if disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;

      await senderChannel.postMessageTo(group, 'Test');

      const [deleteMessageRequest, getChatRequest] = chats.outgoing.getAll<'deleteMessage', 'getChat', 'sendMessage'>();

      expect(chats.outgoing).toHaveLength(3);
      expect(deleteMessageRequest?.method).toEqual('deleteMessage');
      expect(getChatRequest?.method).toEqual('getChat');
      expect(chats.deletionsFor(group).length).toEqual(1);
    });

    it('should not delete message if sent by GroupAnonymousBot', async () => {
      // GroupAnonymousBot (from.id === CHANNEL_BOT_ID) with no sender_chat → senderChatId and parentChannelId
      // are both undefined, so senderChatId === parentChannelId is true → next() is called, no deletion
      await bot.handleUpdate({
        update_id: 1,
        message: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          text: 'Test',
          chat: { id: group.id, type: 'supergroup' as const, title: 'Test Group' },
          from: { id: 136_817_688, username: 'GroupAnonymousBot', is_bot: false, first_name: '' },
        },
      });

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
      chats.outgoing.clear();
      user.replies.clear();
      chats.deletionsFor(group).clear();
    });

    it('should not delete message from a channel when feature is disabled', async () => {
      await senderChannel.postMessageTo(group, 'Test');

      expect(chats.outgoing).toHaveLength(0);
    });

    it('should not delete message from the same channel', async () => {
      await bot.handleUpdate(
        buildChannelUpdate(group.id, {
          from: { id: 136_817_688, username: 'Channel_Bot' },
          senderChatId: 54_321,
          replySenderChatId: 54_321,
        }),
      );

      expect(chats.outgoing).toHaveLength(0);
    });
  });
});
