import { hydrateReply } from '@grammyjs/parse-mode';
import { Bot } from 'grammy';

import { getDenylistComposer } from '@bot/composers/messages/denylist.composer';
import { parseText, stateMiddleware } from '@bot/middleware';
import { selfDestructedReply } from '@bot/plugins';

import type { OutgoingRequests } from '@testing/';
import { MessageMockUpdate, prepareBotForTesting } from '@testing/';
import { mockChatSession } from '@testing/../testing-main';

import type { GrammyContext } from '@types/';

let outgoingRequests: OutgoingRequests;
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
    bot.use(hydrateReply);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(parseText);
    bot.use(mockChatSessionMiddleware);
    bot.use(denylistComposer);

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, {
      getChat: {
        invite_link: '',
      },
    });
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteDenylist = true;
      chatSession.chatSettings.denylist = [testWord];
      chatSession.chatSettings.disableDeleteMessage = false;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should delete if denylist word is used', async () => {
      const update = new MessageMockUpdate(testWord).build();

      await bot.handleUpdate(update);

      const expectedMethods = outgoingRequests.buildMethods(['deleteMessage', 'getChat', 'sendMessage', 'sendMessage']);
      const actualMethods = outgoingRequests.getMethods();

      expect(actualMethods).toEqual(expectedMethods);
    });

    it('should delete if denylist word is part of a larger message', async () => {
      const update = new MessageMockUpdate(`Larger message ${testWord} wrapped word is part of another string`).build();

      await bot.handleUpdate(update);

      const expectedMethods = outgoingRequests.buildMethods(['deleteMessage', 'getChat', 'sendMessage', 'sendMessage']);
      const actualMethods = outgoingRequests.getMethods();

      expect(actualMethods).toEqual(expectedMethods);
    });

    it('should delete case-insensitively', async () => {
      const update = new MessageMockUpdate(testWord.toUpperCase()).build();

      await bot.handleUpdate(update);

      const expectedMethods = outgoingRequests.buildMethods(['deleteMessage', 'getChat', 'sendMessage', 'sendMessage']);
      const actualMethods = outgoingRequests.getMethods();

      expect(actualMethods).toEqual(expectedMethods);
    });

    it('should delete and skip user notification when disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;
      const update = new MessageMockUpdate(testWord).build();

      await bot.handleUpdate(update);

      const expectedMethods = outgoingRequests.buildMethods(['deleteMessage', 'getChat', 'sendMessage']);
      const actualMethods = outgoingRequests.getMethods();

      expect(actualMethods).toEqual(expectedMethods);
      chatSession.chatSettings.disableDeleteMessage = false;
    });

    it('should not delete if word is not in denylist', async () => {
      const update = new MessageMockUpdate('not a banned word').build();

      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteDenylist = false;
      chatSession.chatSettings.denylist = [testWord];
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should not delete if enableDeleteDenylist is false even when denylist has words', async () => {
      const update = new MessageMockUpdate(testWord).build();

      await bot.handleUpdate(update);
      expect(outgoingRequests.length).toEqual(0);
    });

    it('should not delete if denylist is empty', async () => {
      chatSession.chatSettings.enableDeleteDenylist = true;
      chatSession.chatSettings.denylist = [];
      const update = new MessageMockUpdate(testWord).build();

      await bot.handleUpdate(update);
      expect(outgoingRequests.length).toEqual(0);
    });
  });
});
