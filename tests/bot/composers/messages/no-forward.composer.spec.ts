import type { Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { getNoForwardsComposer } from '@bot/composers/messages/no-forward.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession } from '@test-helpers/session-mocks';

const forwardOrigin = {
  type: 'user' as const,
  sender_user: { id: 99_999, first_name: 'Forwarder', is_bot: false },
  date: 1_000_000,
};

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;

const { noForwardsComposer } = getNoForwardsComposer();
const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({
  chatSettings: {
    enableDeleteForwards: true,
    disableDeleteMessage: false,
  },
});

describe('noForwardsComposer', () => {
  beforeAll(async () => {
    bot.use(i18n);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(mockChatSessionMiddleware);
    bot.use(noForwardsComposer);

    ({ chats } = await prepareBot<GrammyContext>(bot));
    user = chats.newUser();
    group = chats.newSupergroup();
  }, 5000);

  describe('with enableDeleteForwards enabled', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteForwards = true;
    });

    beforeEach(() => {
      chats.clear();
    });

    it('should delete a forwarded message and send reply when disableDeleteMessage is false', async () => {
      chatSession.chatSettings.disableDeleteMessage = false;
      await user.sendForwarded('Forwarded content', { forwardOrigin, chat: group });

      expect(chats.outgoing.getMethods()).toContain('deleteMessage');
      expect(chats.outgoing.getMethods()).toContain('sendMessage');
      expect(chats.deletionsFor(group).length).toEqual(1);
    });

    it('should delete a forwarded message but NOT send reply when disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;
      await user.sendForwarded('Forwarded content', { forwardOrigin, chat: group });

      expect(chats.outgoing.getMethods()).toContain('deleteMessage');
      expect(chats.outgoing.getMethods()).not.toContain('sendMessage');
      expect(chats.deletionsFor(group).length).toEqual(1);
    });

    it('should not delete a non-forwarded message', async () => {
      await user.sendText('Normal message', { chat: group });

      expect(chats.outgoing.getMethods()).not.toContain('deleteMessage');
    });
  });

  describe('with enableDeleteForwards disabled', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteForwards = false;
    });

    beforeEach(() => {
      chats.clear();
    });

    it('should not delete a forwarded message', async () => {
      await user.sendForwarded('Forwarded content', { forwardOrigin, chat: group });

      expect(chats.outgoing.getMethods()).not.toContain('deleteMessage');
    });
  });
});
