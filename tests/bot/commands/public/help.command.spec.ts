import { Bot } from 'grammy';

import { HelpCommand } from '@bot/commands/public/help.command';
import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { OutgoingRequests } from '@testing/outgoing-requests';
import type { ApiResponses } from '@testing/prepare';
import { prepareBotForTesting } from '@testing/prepare';
import { mockChatSession } from '@testing/testing-main';
import { MessageMockUpdate } from '@testing/updates/message-super-group-mock.update';

import type { GrammyContext } from '@app-types/context';

let outgoingRequests: OutgoingRequests;
const bot = new Bot<GrammyContext>('mock');
const helpMiddleware = new HelpCommand(new Date());
const genericUpdate = new MessageMockUpdate('');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({});

const chatAdmins = [genericUpdate.genericOwner, genericUpdate.genericAdmin];

const apiResponses: ApiResponses = {
  getChatMember: { status: 'creator' },
  getChatAdministrators: chatAdmins,
};

const commandText = '/help';

/**
 *
 */
function getHelpCommandUpdate() {
  return new MessageMockUpdate(commandText).buildOverwrite({
    message: {
      entities: [{ offset: 0, length: commandText.length, type: 'bot_command' }],
    },
  });
}

describe('HelpCommand', () => {
  beforeAll(async () => {
    const { beforeAnyComposer } = getBeforeAnyComposer();

    bot.use(i18n);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(beforeAnyComposer);
    bot.use(mockChatSessionMiddleware);

    bot.command('help', helpMiddleware.middleware());

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, apiResponses);
  }, 5000);

  beforeEach(() => {
    outgoingRequests.clear();
    chatSession.isBotAdmin = true;
  });

  describe('group flow', () => {
    describe('bot is admin', () => {
      it('should reply with help message', async () => {
        await bot.handleUpdate(getHelpCommandUpdate());

        expect(outgoingRequests.getMethods()).toContain('getChatMember');
        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });
    });

    describe('bot is not admin', () => {
      beforeEach(() => {
        chatSession.isBotAdmin = false;
      });

      it('should reply with help message when bot is not admin', async () => {
        await bot.handleUpdate(getHelpCommandUpdate());

        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });
    });
  });
});
