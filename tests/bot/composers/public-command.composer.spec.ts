import { Bot } from 'grammy';

import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { getPublicCommandsComposer } from '@bot/composers/public-command.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { OutgoingRequests } from '@testing/outgoing-requests';
import type { ApiResponses } from '@testing/prepare';
import { prepareBotForTesting } from '@testing/prepare';
import { mockChatSession, mockSession } from '@testing/testing-main';
import { MessageMockUpdate } from '@testing/updates/message-super-group-mock.update';

import type { GrammyContext } from '@app-types/context';

let outgoingRequests: OutgoingRequests;
const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({});

const { session, mockSessionMiddleware } = mockSession({
  isCurrentUserAdmin: false,
});

const apiResponses: ApiResponses = {
  getChatMember: { status: 'creator' },
  getChatAdministrators: [new MessageMockUpdate('').genericOwner, new MessageMockUpdate('').genericAdmin],
};

/**
 * Builds a command update for the provided text.
 * @param text - Command text to send.
 * @returns Telegram update payload.
 */
function getCommandUpdate(text: string) {
  const command = text.split(' ')[0] ?? text;

  return new MessageMockUpdate(text).buildOverwrite({
    message: {
      entities: [{ offset: 0, length: command.length, type: 'bot_command' }],
    },
  });
}

describe('PublicCommandsComposer', () => {
  beforeAll(async () => {
    const { beforeAnyComposer } = getBeforeAnyComposer();
    const { publicCommandsComposer } = getPublicCommandsComposer({ startTime: new Date('2026-03-18T00:00:00.000Z') });

    bot.use(i18n);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(mockSessionMiddleware);
    bot.use(beforeAnyComposer);
    bot.use(mockChatSessionMiddleware);
    bot.use(publicCommandsComposer);

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, apiResponses);
  }, 5000);

  beforeEach(() => {
    outgoingRequests.clear();
    chatSession.isBotAdmin = true;
    chatSession.language = undefined;
    delete session.roleMode;
    session.isCurrentUserAdmin = false;

    if (apiResponses.getChatMember) {
      apiResponses.getChatMember.status = 'creator';
    }
  });

  describe('handled commands', () => {
    it('should delete the incoming /language command before replying', async () => {
      await bot.handleUpdate(getCommandUpdate('/language'));

      expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember', 'deleteMessage', 'sendMessage']));
    });

    it('should delete the incoming /status command before replying', async () => {
      await bot.handleUpdate(getCommandUpdate('/status'));

      expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember', 'deleteMessage', 'sendMessage']));
    });

    it('should delete the incoming /role command before replying', async () => {
      await bot.handleUpdate(getCommandUpdate('/role'));

      expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember', 'deleteMessage', 'sendMessage']));
    });
  });

  describe('non-command messages', () => {
    it('should not delete plain user messages that are not handled by the public commands composer', async () => {
      await bot.handleUpdate(new MessageMockUpdate('hello').build());

      expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember']));
    });
  });
});
