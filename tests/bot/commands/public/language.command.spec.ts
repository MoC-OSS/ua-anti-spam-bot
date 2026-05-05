import type { Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { LanguageCommand } from '@bot/commands/public/language.command';
import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession } from '@test-helpers/session-mocks';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;

const bot = new Bot<GrammyContext>('mock');
const languageMiddleware = new LanguageCommand();

const { chatSession, mockChatSessionMiddleware } = mockChatSession({});

describe('LanguageCommand', () => {
  beforeAll(async () => {
    const { beforeAnyComposer } = getBeforeAnyComposer();

    bot.use(i18n);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(beforeAnyComposer);
    bot.use(mockChatSessionMiddleware);

    bot.command('language', languageMiddleware.middleware());

    ({ chats } = await prepareBot<GrammyContext>(bot));

    user = chats.newUser();
    group = chats.newSupergroup();
    group.own(user);
  }, 5000);

  beforeEach(() => {
    chats.clear();
    chatSession.language = undefined;
  });

  describe('middleware', () => {
    it('should not allow a regular group member to change the language', async () => {
      chats.outgoing.respondNext('getChatMember', { status: 'member' });
      await user.sendCommand('/language', 'en', { chat: group });

      expect(chatSession.language).toBeUndefined();
      expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember', 'sendMessage']));
    });

    describe('toggle - no argument', () => {
      it('should toggle from Ukrainian (default) to English', async () => {
        chatSession.language = 'uk';

        await user.sendCommand('/language', undefined, { chat: group });

        expect(chatSession.language).toBe('en');
        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });

      it('should toggle from English back to Ukrainian', async () => {
        chatSession.language = 'en';

        await user.sendCommand('/language', undefined, { chat: group });

        expect(chatSession.language).toBe('uk');
        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });

      it('should default to Ukrainian when language is not set in session', async () => {
        await user.sendCommand('/language', undefined, { chat: group });

        expect(chatSession.language).toBe('en');
        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });
    });

    describe('explicit language argument', () => {
      it('should set language to Ukrainian when "uk" is provided', async () => {
        await user.sendCommand('/language', 'uk', { chat: group });

        expect(chatSession.language).toBe('uk');
        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });

      it('should set language to English when "en" is provided', async () => {
        await user.sendCommand('/language', 'en', { chat: group });

        expect(chatSession.language).toBe('en');
        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });

      it('should reply with an error for an unsupported language code', async () => {
        await user.sendCommand('/language', 'fr', { chat: group });

        expect(chatSession.language).toBeUndefined();
        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });

      it('should not change the session language for an invalid argument', async () => {
        chatSession.language = 'uk';

        await user.sendCommand('/language', 'invalid', { chat: group });

        expect(chatSession.language).toBe('uk');
      });
    });
  });
});
