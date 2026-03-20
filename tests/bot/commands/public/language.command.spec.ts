import { Bot } from 'grammy';

import { LanguageCommand } from '@bot/commands/public/language.command';
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
const languageMiddleware = new LanguageCommand();

const { chatSession, mockChatSessionMiddleware } = mockChatSession({});

const apiResponses: ApiResponses = {
  getChatMember: { status: 'creator' },
};

/**
 * Builds a /language command update with an optional argument.
 * @param argument - Optional language argument appended after the command.
 * @returns A MessageMockUpdate representing the /language command.
 */
function getLanguageCommandUpdate(argument = '') {
  const commandText = argument ? `/language ${argument}` : '/language';

  return new MessageMockUpdate(commandText).buildOverwrite({
    message: {
      entities: [{ offset: 0, length: '/language'.length, type: 'bot_command' }],
    },
  });
}

describe('LanguageCommand', () => {
  beforeAll(async () => {
    const { beforeAnyComposer } = getBeforeAnyComposer();

    bot.use(i18n);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(beforeAnyComposer);
    bot.use(mockChatSessionMiddleware);

    bot.command('language', languageMiddleware.middleware());

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, apiResponses);
  }, 5000);

  beforeEach(() => {
    outgoingRequests.clear();
    chatSession.language = undefined;

    if (apiResponses.getChatMember) {
      apiResponses.getChatMember.status = 'creator';
    }
  });

  describe('middleware', () => {
    it('should not allow a regular group member to change the language', async () => {
      if (apiResponses.getChatMember) {
        apiResponses.getChatMember.status = 'member';
      }

      await bot.handleUpdate(getLanguageCommandUpdate('en'));

      expect(chatSession.language).toBeUndefined();
      expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember', 'sendMessage']));
    });

    describe('toggle - no argument', () => {
      it('should toggle from Ukrainian (default) to English', async () => {
        chatSession.language = 'uk';

        await bot.handleUpdate(getLanguageCommandUpdate());

        expect(chatSession.language).toBe('en');
        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });

      it('should toggle from English back to Ukrainian', async () => {
        chatSession.language = 'en';

        await bot.handleUpdate(getLanguageCommandUpdate());

        expect(chatSession.language).toBe('uk');
        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });

      it('should default to Ukrainian when language is not set in session', async () => {
        // language is undefined → should treat as 'uk' and toggle to 'en'
        await bot.handleUpdate(getLanguageCommandUpdate());

        expect(chatSession.language).toBe('en');
        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });
    });

    describe('explicit language argument', () => {
      it('should set language to Ukrainian when "uk" is provided', async () => {
        await bot.handleUpdate(getLanguageCommandUpdate('uk'));

        expect(chatSession.language).toBe('uk');
        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });

      it('should set language to English when "en" is provided', async () => {
        await bot.handleUpdate(getLanguageCommandUpdate('en'));

        expect(chatSession.language).toBe('en');
        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });

      it('should reply with an error for an unsupported language code', async () => {
        await bot.handleUpdate(getLanguageCommandUpdate('fr'));

        expect(chatSession.language).toBeUndefined();
        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });

      it('should not change the session language for an invalid argument', async () => {
        chatSession.language = 'uk';

        await bot.handleUpdate(getLanguageCommandUpdate('invalid'));

        expect(chatSession.language).toBe('uk');
      });
    });
  });
});
