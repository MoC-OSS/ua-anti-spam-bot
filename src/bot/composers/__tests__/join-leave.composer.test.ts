import { Bot } from 'grammy';
import type { PartialDeep } from 'type-fest';

import type { OutgoingRequests } from '../../../testing';
import { LeftMemberMockUpdate, NewMemberMockUpdate, prepareBotForTesting } from '../../../testing';
import type { ChatSessionData, GrammyContext } from '../../../types';
import { stateMiddleware } from '../../middleware';
import { getJoinLeaveComposer } from '../join-leave.composer';

let outgoingRequests: OutgoingRequests;
const { joinLeaveComposer } = getJoinLeaveComposer();
const bot = new Bot<GrammyContext>('mock');

const chatSession = {
  chatSettings: {
    disableDeleteServiceMessage: false,
  },
} as PartialDeep<ChatSessionData> as ChatSessionData;

describe('joinLeaveComposer main', () => {
  beforeAll(async () => {
    bot.use(stateMiddleware);
    // Register mock chat session
    bot.use((context, next) => {
      context.chatSession = chatSession;
      return next();
    });

    bot.use(joinLeaveComposer);

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot);
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.disableDeleteServiceMessage = false;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should delete new user service message', async () => {
      const update = new NewMemberMockUpdate().build();
      await bot.handleUpdate(update);

      const apiCall = outgoingRequests.getLast();

      expect(outgoingRequests.length).toEqual(1);
      expect(apiCall?.method).toEqual('deleteMessage');
    });

    it('should delete left user service message', async () => {
      const update = new LeftMemberMockUpdate().build();
      await bot.handleUpdate(update);

      const apiCall = outgoingRequests.getLast();

      expect(outgoingRequests.length).toEqual(1);
      expect(apiCall?.method).toEqual('deleteMessage');
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.disableDeleteServiceMessage = true;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should not delete new user service message', async () => {
      const update = new NewMemberMockUpdate().build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });

    it('should not delete left user service message', async () => {
      const update = new LeftMemberMockUpdate().build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });
  });
});
