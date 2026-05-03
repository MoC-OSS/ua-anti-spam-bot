import type { Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { getJoinLeaveComposer } from '@bot/composers/join-leave.composer';
import { stateMiddleware } from '@bot/middleware/state.middleware';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession } from '@test-helpers/session-mocks';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;

const { joinLeaveComposer } = getJoinLeaveComposer();
const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({
  chatSettings: {
    disableDeleteServiceMessage: false,
  },
});

// kept for the one test that requires a combined my_chat_member + message update
// (grammy-testing does not support combined updates with my_chat_member)
const genericUser = {
  id: 1_111_111,
  first_name: 'GrammyMock FirstName',
  last_name: 'GrammyMock LastName',
  username: 'GrammyMock_Username',
  is_bot: false,
};

const genericUserBot = {
  id: 2022,
  is_bot: true,
  first_name: 'GrammyMock BotFirstName',
  last_name: 'GrammyMock BotLastName',
  username: 'GrammyMock_bot',
};

describe('joinLeaveComposer main', () => {
  beforeAll(async () => {
    bot.use(stateMiddleware);
    bot.use(mockChatSessionMiddleware);

    bot.use(joinLeaveComposer);

    ({ chats } = await prepareBot<GrammyContext>(bot));
    user = chats.newUser();
    group = chats.newSupergroup();
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
        chats.clear();
      });

      it('should delete new user service message', async () => {
        await user.joinChat(group);

        const apiCall = chats.outgoing.getLast<'deleteMessage'>();

        expect(chats.outgoing.length).toEqual(1);
        expect(apiCall?.method).toEqual('deleteMessage');
      });

      it('should delete left user service message', async () => {
        await user.leaveChat(group);

        const apiCall = chats.outgoing.getLast<'deleteMessage'>();

        expect(chats.outgoing.length).toEqual(1);
        expect(apiCall?.method).toEqual('deleteMessage');
      });

      it('should not delete left bot service message', async () => {
        // grammy-testing does not support combined my_chat_member + message updates;
        // the my_chat_member with status 'kicked' is what triggers the skip-deletion filter
        await bot.handleUpdate({
          update_id: 1,
          my_chat_member: {
            chat: { id: group.id, type: 'supergroup' as const, title: 'GrammyMock' },
            from: genericUser,
            date: Math.floor(Date.now() / 1000),
            old_chat_member: { status: 'member', user: genericUserBot },
            new_chat_member: { status: 'kicked', user: genericUserBot, until_date: Math.floor(Date.now() / 1000) },
          },
          message: {
            message_id: 230,
            from: genericUser,
            date: Math.floor(Date.now() / 1000),
            chat: { id: group.id, type: 'supergroup' as const, title: 'GrammyMock' },
            left_chat_member: genericUserBot,
          },
        });

        expect(chats.outgoing.length).toEqual(0);
      });

      it('should delete new bot service message', async () => {
        await user.joinChat(group);

        const apiCall = chats.outgoing.getLast<'deleteMessage'>();

        expect(chats.outgoing.length).toEqual(1);
        expect(apiCall?.method).toEqual('deleteMessage');
      });
    });

    describe('bot is not admin', () => {
      beforeAll(() => {
        chatSession.isBotAdmin = false;
      });

      beforeEach(() => {
        chats.clear();
      });

      it('should not delete new user service message', async () => {
        await user.joinChat(group);

        expect(chats.outgoing.length).toEqual(0);
      });

      it('should not delete left user service message', async () => {
        await user.leaveChat(group);

        expect(chats.outgoing.length).toEqual(0);
      });
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.disableDeleteServiceMessage = true;
    });

    beforeEach(() => {
      chats.clear();
    });

    it('should not delete new user service message', async () => {
      await user.joinChat(group);

      expect(chats.outgoing.length).toEqual(0);
    });

    it('should not delete left user service message', async () => {
      await user.leaveChat(group);

      expect(chats.outgoing.length).toEqual(0);
    });
  });
});
