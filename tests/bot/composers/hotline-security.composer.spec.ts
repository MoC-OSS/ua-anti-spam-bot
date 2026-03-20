import { Bot } from 'grammy';

import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { getHotlineSecurityComposer } from '@bot/composers/hotline-security.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { OutgoingRequests } from '@testing/outgoing-requests';
import { prepareBotForTesting } from '@testing/prepare';
import { mockChatSession } from '@testing/testing-main';
import { MessagePrivateMockUpdate } from '@testing/updates/message-private-mock.update';
import { MessageMockUpdate } from '@testing/updates/message-super-group-mock.update';

import type { GrammyContext } from '@app-types/context';

let outgoingRequests: OutgoingRequests;
const bot = new Bot<GrammyContext>('mock');
const { hotlineSecurityComposer } = getHotlineSecurityComposer();
const { chatSession, mockChatSessionMiddleware } = mockChatSession({ isBotAdmin: true });

const commandText = '/hotline_security';

/**
 *
 */
function getHotlineUpdate() {
  return new MessageMockUpdate(commandText).buildOverwrite({
    message: {
      entities: [{ offset: 0, length: commandText.length, type: 'bot_command' }],
    },
  });
}

/**
 *
 */
function getPrivateHotlineUpdate() {
  return new MessagePrivateMockUpdate(commandText).buildOverwrite({
    message: {
      entities: [{ offset: 0, length: commandText.length, type: 'bot_command' }],
    },
  });
}

describe('hotlineSecurityComposer', () => {
  beforeAll(async () => {
    const { beforeAnyComposer } = getBeforeAnyComposer();

    bot.use(i18n);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(beforeAnyComposer);
    bot.use(mockChatSessionMiddleware);
    bot.use(hotlineSecurityComposer);

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot);
  }, 5000);

  beforeEach(() => {
    outgoingRequests.clear();
    chatSession.isBotAdmin = true;
  });

  describe('/hotline_security command', () => {
    describe('positive cases', () => {
      it('should delete the command message and send help message', async () => {
        await bot.handleUpdate(getHotlineUpdate());

        const methods = outgoingRequests.getMethods();

        expect(methods).toContain('deleteMessage');
        expect(methods).toContain('sendMessage');
      });

      it('should handle the command in private chat too', async () => {
        await bot.handleUpdate(getPrivateHotlineUpdate());

        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });
    });
  });
});
