import { hydrateReply } from '@grammyjs/parse-mode';
import { Bot } from 'grammy';

import { getNoAntisemitismComposer } from '../../../../src/bot/composers/messages/no-antisemitism.composer';
import { parseText, stateMiddleware } from '../../../../src/bot/middleware';
import { selfDestructedReply } from '../../../../src/bot/plugins';
import type { OutgoingRequests } from '../../../../src/testing';
import { MessageMockUpdate, prepareBotForTesting } from '../../../../src/testing';
import { mockChatSession } from '../../../../src/testing-main';
import type { GrammyContext } from '../../../../src/types';

let outgoingRequests: OutgoingRequests;
const { noAntisemitismComposer: noAntisemitismComposerTest } = getNoAntisemitismComposer();
const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({
  chatSettings: {
    disableDeleteAntisemitism: false,
    disableDeleteMessage: false,
  },
});

describe('noAntisemitismComposer', () => {
  beforeAll(async () => {
    bot.use(hydrateReply);
    bot.use(selfDestructedReply());

    bot.use(stateMiddleware);
    bot.use(parseText);
    bot.use(mockChatSessionMiddleware);

    bot.use(noAntisemitismComposerTest);

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, {
      getChat: {
        invite_link: '',
      },
    });
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.disableDeleteAntisemitism = false;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should delete if antisemitism is used', async () => {
      const update = new MessageMockUpdate('этих евреев нужно сжигать. по другому никак').build();
      await bot.handleUpdate(update);

      const expectedMethods = outgoingRequests.buildMethods(['deleteMessage', 'getChat', 'sendMessage', 'sendMessage']);

      const actualMethods = outgoingRequests.getMethods();

      expect(expectedMethods).toEqual(actualMethods);
    });

    it('should delete if antisemitism is used and do not notify if disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;
      const update = new MessageMockUpdate('Нос жидовский, как у меня').build();
      await bot.handleUpdate(update);

      const expectedMethods = outgoingRequests.buildMethods(['deleteMessage', 'getChat', 'sendMessage']);

      const actualMethods = outgoingRequests.getMethods();

      expect(expectedMethods).toEqual(actualMethods);
    });

    it('should not delete if not antisemitism', async () => {
      const update = new MessageMockUpdate('Миру мир, а евреям деньги').build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.disableDeleteAntisemitism = true;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should not delete if antisemitism is used', async () => {
      const update = new MessageMockUpdate('Нос жидовский, как у меня').build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });

    it('should not delete if not antisemitism is used', async () => {
      const update = new MessageMockUpdate('Миру мир, а евреям деньги').build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });
  });
});
