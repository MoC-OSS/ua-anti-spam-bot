import type { Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { getWarnObsceneComposer } from '@bot/composers/messages/warn-obscene.composer';
import { i18n } from '@bot/i18n';
import { parseText } from '@bot/middleware/parse-text.middleware';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession } from '@test-helpers/session-mocks';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;

const { warnObsceneComposer: warnObsceneComposerTest } = getWarnObsceneComposer();
const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({
  chatSettings: {
    enableWarnObscene: true,
    disableDeleteMessage: false,
  },
});

describe('warnObsceneComposer', () => {
  beforeAll(async () => {
    bot.use(i18n);
    bot.use(selfDestructedReply());

    bot.use(stateMiddleware);
    bot.use(parseText);
    bot.use(mockChatSessionMiddleware);

    bot.use(warnObsceneComposerTest);

    ({ chats } = await prepareBot<GrammyContext>(bot, {
      responses: {
        getChat: {
          invite_link: '',
        },
      },
    }));

    user = chats.newUser();
    group = chats.newSupergroup();
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableWarnObscene = true;
    });

    beforeEach(() => {
      chats.outgoing.clear();
      user.replies.clear();
    });

    it('should warn if obscene is used', async () => {
      await user.sendText('він сказав дебіл', { chat: group });

      const expectedMethods = chats.outgoing.buildMethods(['getChat', 'sendMessage', 'sendMessage']);
      const actualMethods = chats.outgoing.getMethods();

      expect(expectedMethods).toEqual(actualMethods);
    });

    it('should warn if obscene is used and do still notify if disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;
      await user.sendText('він сказав дебіл', { chat: group });

      const expectedMethods = chats.outgoing.buildMethods(['getChat', 'sendMessage', 'sendMessage']);
      const actualMethods = chats.outgoing.getMethods();

      expect(expectedMethods).toEqual(actualMethods);
    });

    it('should not warn if not obscene', async () => {
      await user.sendText(
        'Інтерактивна мапа дозволяє швидко і зручно дізнатися погоду в містах України. На ній відображаються погодні умови в найбільших містах України з можливістю перегляду прогнозу погоди на тиждень. Щоб дізнатися докладний прогноз погоди в вашому місті досить натиснути на назву населеного пункту на мапі.',
        { chat: group },
      );

      expect(chats.outgoing.length).toEqual(0);
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableWarnObscene = false;
    });

    beforeEach(() => {
      chats.outgoing.clear();
      user.replies.clear();
    });

    it('should not warn if obscene is used', async () => {
      await user.sendText('він сказав дебіл', { chat: group });

      expect(chats.outgoing.length).toEqual(0);
    });

    it('should not warn if not obscene is used', async () => {
      await user.sendText(
        'Інтерактивна мапа дозволяє швидко і зручно дізнатися погоду в містах України. На ній відображаються погодні умови в найбільших містах України з можливістю перегляду прогнозу погоди на тиждень. Щоб дізнатися докладний прогноз погоди в вашому місті досить натиснути на назву населеного пункту на мапі.',
        { chat: group },
      );

      expect(chats.outgoing.length).toEqual(0);
    });
  });
});
