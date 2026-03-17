import { Bot } from 'grammy';

import { getNoForwardsComposer } from '@bot/composers/messages/no-forward.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { OutgoingRequests } from '@testing/outgoing-requests';
import { prepareBotForTesting } from '@testing/prepare';
import { mockChatSession } from '@testing/testing-main';
import { MessageMockUpdate } from '@testing/updates/message-super-group-mock.update';

import type { GrammyContext } from '@app-types/context';

const forwardedUpdateOverwrite = {
  message: {
    forward_origin: {
      type: 'user' as const,
      sender_user: { id: 99_999, first_name: 'Forwarder', is_bot: false },
      date: 1_000_000,
    },
  },
};

let outgoingRequests: OutgoingRequests;
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

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, { getChat: { invite_link: '' } });
  }, 5000);

  describe('with enableDeleteForwards enabled', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteForwards = true;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should delete a forwarded message and send reply when disableDeleteMessage is false', async () => {
      chatSession.chatSettings.disableDeleteMessage = false;
      const update = new MessageMockUpdate('Forwarded content').buildOverwrite(forwardedUpdateOverwrite);

      await bot.handleUpdate(update);

      expect(outgoingRequests.getMethods()).toContain('deleteMessage');
      expect(outgoingRequests.getMethods()).toContain('sendMessage');
    });

    it('should delete a forwarded message but NOT send reply when disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;
      const update = new MessageMockUpdate('Forwarded content').buildOverwrite(forwardedUpdateOverwrite);

      await bot.handleUpdate(update);

      expect(outgoingRequests.getMethods()).toContain('deleteMessage');
      expect(outgoingRequests.getMethods()).not.toContain('sendMessage');
    });

    it('should not delete a non-forwarded message', async () => {
      const update = new MessageMockUpdate('Normal message').build();

      await bot.handleUpdate(update);

      expect(outgoingRequests.getMethods()).not.toContain('deleteMessage');
    });
  });

  describe('with enableDeleteForwards disabled', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteForwards = false;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should not delete a forwarded message', async () => {
      const update = new MessageMockUpdate('Forwarded content').buildOverwrite(forwardedUpdateOverwrite);

      await bot.handleUpdate(update);

      expect(outgoingRequests.getMethods()).not.toContain('deleteMessage');
    });
  });
});
