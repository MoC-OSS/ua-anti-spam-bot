import { Bot } from 'grammy';
import type { Chats, Supergroup, User } from 'grammy-testing';
import { prepareBot } from 'grammy-testing';

import { getNoAntisemitismComposer } from '@bot/composers/messages/no-antisemitism.composer';
import { i18n } from '@bot/i18n';
import { parseText } from '@bot/middleware/parse-text.middleware';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession } from '@test-helpers/session-mocks';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;

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
    bot.use(i18n);
    bot.use(selfDestructedReply());

    bot.use(stateMiddleware);
    bot.use(parseText);
    bot.use(mockChatSessionMiddleware);

    bot.use(noAntisemitismComposerTest);

    ({ chats } = await prepareBot<GrammyContext>(bot));

    user = chats.newUser();
    group = chats.newSupergroup();
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.disableDeleteAntisemitism = false;
    });

    beforeEach(() => {
      chats.clear();
    });

    it('should delete if antisemitism is used', async () => {
      await user.sendText('этих евреев нужно сжигать. по другому никак', { chat: group });

      const expectedMethods = chats.outgoing.buildMethods(['deleteMessage', 'getChat', 'sendMessage', 'sendMessage']);
      const actualMethods = chats.outgoing.getMethods();

      expect(expectedMethods).toEqual(actualMethods);
      expect(chats.deletionsFor(group).length).toEqual(1);
    });

    it('should delete if antisemitism is used and do not notify if disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;
      await user.sendText('Нос жидовский, как у меня', { chat: group });

      const expectedMethods = chats.outgoing.buildMethods(['deleteMessage', 'getChat', 'sendMessage']);
      const actualMethods = chats.outgoing.getMethods();

      expect(expectedMethods).toEqual(actualMethods);
      expect(chats.deletionsFor(group).length).toEqual(1);
    });

    it('should not delete if not antisemitism', async () => {
      await user.sendText('Миру мир, а евреям деньги', { chat: group });

      expect(chats.outgoing.length).toEqual(0);
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.disableDeleteAntisemitism = true;
    });

    beforeEach(() => {
      chats.clear();
    });

    it('should not delete if antisemitism is used', async () => {
      await user.sendText('Нос жидовский, как у меня', { chat: group });

      expect(chats.outgoing.length).toEqual(0);
    });

    it('should not delete if not antisemitism is used', async () => {
      await user.sendText('Миру мир, а евреям деньги', { chat: group });

      expect(chats.outgoing.length).toEqual(0);
    });
  });
});
