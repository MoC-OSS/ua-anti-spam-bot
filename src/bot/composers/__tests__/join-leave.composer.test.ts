import { Bot } from 'grammy';

import type { OutgoingRequests } from '../../../testing';
import { LeftMemberMockUpdate, NewMemberMockUpdate, prepareBotForTesting } from '../../../testing';
import { mockChatSession } from '../../../testing-main';
import type { GrammyContext } from '../../../types';
import { stateMiddleware } from '../../middleware';
import { getJoinLeaveComposer } from '../join-leave.composer';

let outgoingRequests: OutgoingRequests;
const { joinLeaveComposer } = getJoinLeaveComposer();
const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({
  chatSettings: {
    disableDeleteServiceMessage: false,
  },
});

describe('joinLeaveComposer main', () => {
  beforeAll(async () => {
    bot.use(stateMiddleware);
    bot.use(mockChatSessionMiddleware);

    bot.use(joinLeaveComposer);

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot);
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.disableDeleteServiceMessage = false;
    });

    describe('bot is admin', () => {
      beforeAll(() => {
        chatSession.isBotAdmin = true;
      });

      beforeEach(() => {
        outgoingRequests.clear();
      });

      it('should delete new user service message', async () => {
        const update = new NewMemberMockUpdate().build();
        await bot.handleUpdate(update);

        const apiCall = outgoingRequests.getLast<'deleteMessage'>();

        expect(outgoingRequests.length).toEqual(1);
        expect(apiCall?.method).toEqual('deleteMessage');
      });

      it('should delete left user service message', async () => {
        const update = new LeftMemberMockUpdate().build();
        await bot.handleUpdate(update);

        const apiCall = outgoingRequests.getLast<'deleteMessage'>();

        expect(outgoingRequests.length).toEqual(1);
        expect(apiCall?.method).toEqual('deleteMessage');
      });

      it('should not delete left bot service message', async () => {
        const updateConstructor = new LeftMemberMockUpdate();
        const update = updateConstructor.buildOverwrite({
          my_chat_member: {
            chat: updateConstructor.genericSuperGroup,
            from: updateConstructor.genericUser,
            date: updateConstructor.genericSentDate,
            old_chat_member: {
              status: 'member',
              user: updateConstructor.genericUserBot,
            },
            new_chat_member: {
              status: 'kicked',
              user: updateConstructor.genericUserBot,
              until_date: updateConstructor.genericSentDate,
            },
          },
          message: {
            left_chat_member: updateConstructor.genericUserBot,
          },
        });

        await bot.handleUpdate(update);

        expect(outgoingRequests.length).toEqual(0);
      });

      it('should delete new bot service message', async () => {
        const updateConstructor = new NewMemberMockUpdate();
        const update = updateConstructor.buildOverwrite({
          my_chat_member: {
            chat: updateConstructor.genericSuperGroup,
            from: updateConstructor.genericUser,
            date: updateConstructor.genericSentDate,
            old_chat_member: {
              status: 'member',
              user: updateConstructor.genericUserBot,
            },
            new_chat_member: {
              status: 'member',
              user: updateConstructor.genericUserBot,
              until_date: updateConstructor.genericSentDate,
            },
          },
          message: {
            new_chat_members: [updateConstructor.genericUserBot],
          },
        });

        await bot.handleUpdate(update);

        const apiCall = outgoingRequests.getLast<'deleteMessage'>();

        expect(outgoingRequests.length).toEqual(1);
        expect(apiCall?.method).toEqual('deleteMessage');
      });
    });

    describe('bot is not admin', () => {
      beforeAll(() => {
        chatSession.isBotAdmin = false;
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
