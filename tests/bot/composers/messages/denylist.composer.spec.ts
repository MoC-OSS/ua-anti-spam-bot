import type { Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { getDenylistComposer } from '@bot/composers/messages/denylist.composer';
import { i18n } from '@bot/i18n';
import { parseText } from '@bot/middleware/parse-text.middleware';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession } from '@test-helpers/session-mocks';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;

const { denylistComposer } = getDenylistComposer();
const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({
  chatSettings: {
    enableDeleteDenylist: true,
    denylist: [],
    disableDeleteMessage: false,
  },
});

const testWord = 'testWord';

describe('denylistComposer', () => {
  beforeAll(async () => {
    bot.use(i18n);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(parseText);
    bot.use(mockChatSessionMiddleware);
    bot.use(denylistComposer);

    ({ chats } = await prepareBot<GrammyContext>(bot));

    user = chats.newUser();
    group = chats.newSupergroup();
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteDenylist = true;
      chatSession.chatSettings.denylist = [testWord];
      chatSession.chatSettings.disableDeleteMessage = false;
    });

    beforeEach(() => {
      chats.clear();
    });

    it('should delete if denylist word is used', async () => {
      await user.sendText(testWord, { chat: group });

      const expectedMethods = chats.outgoing.buildMethods(['deleteMessage', 'getChat', 'sendMessage', 'sendMessage']);
      const actualMethods = chats.outgoing.getMethods();

      expect(actualMethods).toEqual(expectedMethods);
      expect(chats.deletionsFor(group).length).toEqual(1);
    });

    it('should delete if denylist word is part of a larger message', async () => {
      await user.sendText(`Larger message ${testWord} wrapped word is part of another string`, { chat: group });

      const expectedMethods = chats.outgoing.buildMethods(['deleteMessage', 'getChat', 'sendMessage', 'sendMessage']);
      const actualMethods = chats.outgoing.getMethods();

      expect(actualMethods).toEqual(expectedMethods);
      expect(chats.deletionsFor(group).length).toEqual(1);
    });

    it('should delete case-insensitively', async () => {
      await user.sendText(testWord.toUpperCase(), { chat: group });

      const expectedMethods = chats.outgoing.buildMethods(['deleteMessage', 'getChat', 'sendMessage', 'sendMessage']);
      const actualMethods = chats.outgoing.getMethods();

      expect(actualMethods).toEqual(expectedMethods);
      expect(chats.deletionsFor(group).length).toEqual(1);
    });

    it('should delete and skip user notification when disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;
      await user.sendText(testWord, { chat: group });

      const expectedMethods = chats.outgoing.buildMethods(['deleteMessage', 'getChat', 'sendMessage']);
      const actualMethods = chats.outgoing.getMethods();

      expect(actualMethods).toEqual(expectedMethods);
      expect(chats.deletionsFor(group).length).toEqual(1);
      chatSession.chatSettings.disableDeleteMessage = false;
    });

    it('should not delete if word is not in denylist', async () => {
      await user.sendText('not a banned word', { chat: group });

      expect(chats.outgoing.length).toEqual(0);
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteDenylist = false;
      chatSession.chatSettings.denylist = [testWord];
    });

    beforeEach(() => {
      chats.clear();
    });

    it('should not delete if enableDeleteDenylist is false even when denylist has words', async () => {
      await user.sendText(testWord, { chat: group });
      expect(chats.outgoing.length).toEqual(0);
    });

    it('should not delete if denylist is empty', async () => {
      chatSession.chatSettings.enableDeleteDenylist = true;
      chatSession.chatSettings.denylist = [];
      await user.sendText(testWord, { chat: group });
      expect(chats.outgoing.length).toEqual(0);
    });
  });
});
