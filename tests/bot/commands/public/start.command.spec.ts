import { Bot } from 'grammy';

import { StartCommand } from '@bot/commands/public/start.command';
import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { OutgoingRequests } from '@testing/outgoing-requests';
import type { ApiResponses } from '@testing/prepare';
import { prepareBotForTesting } from '@testing/prepare';
import { mockChatSession } from '@testing/testing-main';
import { MessagePrivateMockUpdate } from '@testing/updates/message-private-mock.update';
import { MessageMockUpdate } from '@testing/updates/message-super-group-mock.update';

import type { GrammyContext } from '@app-types/context';

let outgoingRequests: OutgoingRequests;
const bot = new Bot<GrammyContext>('mock');
const startMiddleware = new StartCommand();
const genericUpdate = new MessageMockUpdate('');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({});

const chatAdmins = [genericUpdate.genericOwner, genericUpdate.genericAdmin];

const apiResponses: ApiResponses = {
  getChatMember: { status: 'creator' },
  getChatAdministrators: chatAdmins,
};

const commandText = '/start';

function getStartCommandUpdate() {
  return new MessageMockUpdate(commandText).buildOverwrite({
    message: {
      entities: [{ offset: 0, length: commandText.length, type: 'bot_command' }],
    },
  });
}

function getPrivateStartCommandUpdate() {
  return new MessagePrivateMockUpdate(commandText).buildOverwrite({
    message: {
      entities: [{ offset: 0, length: commandText.length, type: 'bot_command' }],
    },
  });
}

describe('StartCommand', () => {
  beforeAll(async () => {
    const { beforeAnyComposer } = getBeforeAnyComposer();

    bot.use(i18n);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(beforeAnyComposer);
    bot.use(mockChatSessionMiddleware);

    bot.command('start', startMiddleware.middleware());

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, apiResponses);
  }, 5000);

  beforeEach(() => {
    outgoingRequests.clear();
    chatSession.isBotAdmin = true;
  });

  describe('private flow', () => {
    it('should reply with start message in a private chat', async () => {
      await bot.handleUpdate(getPrivateStartCommandUpdate());

      expect(outgoingRequests.getMethods()).toContain('sendMessage');
    });
  });

  describe('group flow', () => {
    describe('bot is not admin', () => {
      beforeEach(() => {
        chatSession.isBotAdmin = false;
      });

      it('should reply with group start message when bot is not admin', async () => {
        await bot.handleUpdate(getStartCommandUpdate());

        expect(outgoingRequests.getMethods()).toContain('getChatMember');
        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });
    });

    describe('bot is admin', () => {
      beforeEach(() => {
        chatSession.isBotAdmin = true;
      });

      it('should reply with group start message when bot is admin', async () => {
        await bot.handleUpdate(getStartCommandUpdate());

        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });
    });
  });
});
