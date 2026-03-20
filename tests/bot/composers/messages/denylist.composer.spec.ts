import { Bot } from 'grammy';

import { getDenylistComposer } from '@bot/composers/messages/denylist.composer';
import { i18n } from '@bot/i18n';
import { parseText } from '@bot/middleware/parse-text.middleware';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { OutgoingRequests } from '@testing/outgoing-requests';
import { prepareBotForTesting } from '@testing/prepare';
import { mockChatSession } from '@testing/testing-main';
import { MessageMockUpdate } from '@testing/updates/message-super-group-mock.update';

import type { GrammyContext } from '@app-types/context';

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
    bot.use(i18n);
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
