import { hydrateReply } from '@grammyjs/parse-mode';
import { Bot } from 'grammy';

import type { OutgoingRequests } from '../../../../testing';
import { MessageSuperGroupMockUpdate, prepareBotForTesting } from '../../../../testing';
import { mockChatSession } from '../../../../testing-main';
import type { GrammyContext } from '../../../../types';
import { parseIsRussian, parseText, stateMiddleware } from '../../../middleware';
import { selfDestructedReply } from '../../../plugins';
import { getWarnObsceneComposer } from '../warn-obscene.composer';

let outgoingRequests: OutgoingRequests;
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
    bot.use(hydrateReply);
    bot.use(selfDestructedReply());

    bot.use(stateMiddleware);
    bot.use(parseText);
    bot.use(parseIsRussian);
    bot.use(mockChatSessionMiddleware);

    bot.use(warnObsceneComposerTest);

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, {
      getChat: {
        invite_link: '',
      },
    });
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableWarnObscene = true;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should warn if obscene is used', async () => {
      const update = new MessageSuperGroupMockUpdate('він сказав дебіл').build();
      await bot.handleUpdate(update);

      const expectedMethods = outgoingRequests.buildMethods(['getChat', 'sendMessage', 'sendMessage']);

      const actualMethods = outgoingRequests.getMethods();

      expect(expectedMethods).toEqual(actualMethods);
    });

    it('should warn if obscene is used and do still notify if disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;
      const update = new MessageSuperGroupMockUpdate('він сказав дебіл').build();
      await bot.handleUpdate(update);

      const expectedMethods = outgoingRequests.buildMethods(['getChat', 'sendMessage', 'sendMessage']);

      const actualMethods = outgoingRequests.getMethods();

      expect(expectedMethods).toEqual(actualMethods);
    });

    it('should not warn if not obscene', async () => {
      const update = new MessageSuperGroupMockUpdate(
        'Інтерактивна мапа дозволяє швидко і зручно дізнатися погоду в містах України. На ній відображаються погодні умови в найбільших містах України з можливістю перегляду прогнозу погоди на тиждень. Щоб дізнатися докладний прогноз погоди в вашому місті досить натиснути на назву населеного пункту на мапі.',
      ).build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableWarnObscene = false;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should not warn if obscene is used', async () => {
      const update = new MessageSuperGroupMockUpdate('він сказав дебіл').build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });

    it('should not warn if not obscene is used', async () => {
      const update = new MessageSuperGroupMockUpdate(
        'Інтерактивна мапа дозволяє швидко і зручно дізнатися погоду в містах України. На ній відображаються погодні умови в найбільших містах України з можливістю перегляду прогнозу погоди на тиждень. Щоб дізнатися докладний прогноз погоди в вашому місті досить натиснути на назву населеного пункту на мапі.',
      ).build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });
  });
});
