import { hydrateReply } from '@grammyjs/parse-mode';
import { Bot } from 'grammy';

import type { OutgoingRequests } from '../../../../testing';
import { MessageMockUpdate, prepareBotForTesting } from '../../../../testing';
import { mockChatSession } from '../../../../testing-main';
import type { GrammyContext } from '../../../../types';
import { parseText, stateMiddleware } from '../../../middleware';
import { selfDestructedReply } from '../../../plugins';
import { getDenylistComposer } from '../denylist.composer';

let outgoingRequests: OutgoingRequests;
const { denylistComposer } = getDenylistComposer();
const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({
  chatSettings: {
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
      chatSession.chatSettings.denylist = [testWord];
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should delete if denylist is used', async () => {
      const update = new MessageMockUpdate(testWord).build();
      await bot.handleUpdate(update);

      const expectedMethods = outgoingRequests.buildMethods(['deleteMessage', 'getChat', 'sendMessage', 'sendMessage']);

      const actualMethods = outgoingRequests.getMethods();

      expect(expectedMethods).toEqual(actualMethods);
    });

    it('should delete if denylist is used and do not notify if disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;
      const update = new MessageMockUpdate(testWord).build();
      await bot.handleUpdate(update);

      const expectedMethods = outgoingRequests.buildMethods(['deleteMessage', 'getChat', 'sendMessage']);

      const actualMethods = outgoingRequests.getMethods();

      expect(expectedMethods).toEqual(actualMethods);
    });

    it('should not delete if word not in denylist', async () => {
      const update = new MessageMockUpdate('not').build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.denylist = [];
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should not delete if denylist is empty', async () => {
      const update = new MessageMockUpdate(testWord).build();
      await bot.handleUpdate(update);
      expect(outgoingRequests.length).toEqual(0);
    });
  });
});
