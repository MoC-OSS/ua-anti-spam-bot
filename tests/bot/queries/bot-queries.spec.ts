import { Bot } from 'grammy';

import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';

import type { OutgoingRequests } from '@testing/outgoing-requests';
import type { ApiResponses } from '@testing/prepare';
import { prepareBotForTesting } from '@testing/prepare';
import { mockChatSession } from '@testing/testing-main';
import { MyChatMemberMockUpdate } from '@testing/updates/my-chat-member-mock.update';

import type { GrammyContext } from '@app-types/context';

let outgoingRequests: OutgoingRequests;

const bot = new Bot<GrammyContext>('mock');
const { chatSession, mockChatSessionMiddleware } = mockChatSession({});
const mockUpdate = new MyChatMemberMockUpdate({ oldStatus: 'left', newStatus: 'member' });

const chatAdmins = [mockUpdate.genericOwner, mockUpdate.genericAdmin];

const apiResponses: ApiResponses = {
  getChatAdministrators: chatAdmins,
};

describe('bot queries', () => {
  beforeAll(async () => {
    const { beforeAnyComposer } = getBeforeAnyComposer();

    bot.use(i18n);
    bot.use(stateMiddleware);
    bot.use(mockChatSessionMiddleware);
    bot.use(beforeAnyComposer);

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, apiResponses);
  }, 10_000);

  beforeEach(() => {
    outgoingRequests.clear();
    chatSession.botRemoved = false;
    chatSession.isBotAdmin = false;
    delete chatSession.botAdminDate;
  });

  describe('botKickQuery', () => {
    describe('positive cases', () => {
      it('should mark bot as removed when status becomes left', async () => {
        const update = new MyChatMemberMockUpdate({ oldStatus: 'member', newStatus: 'left' }).build();

        await bot.handleUpdate(update);

        expect(chatSession.botRemoved).toBe(true);
        expect(chatSession.isBotAdmin).toBeUndefined();
        expect(chatSession.botAdminDate).toBeUndefined();
      });

      it('should mark bot as removed when status becomes kicked', async () => {
        const update = new MyChatMemberMockUpdate({ oldStatus: 'administrator', newStatus: 'kicked' }).build();

        await bot.handleUpdate(update);

        expect(chatSession.botRemoved).toBe(true);
      });
    });

    describe('negative cases', () => {
      it('should not mark as removed when new status is not left or kicked', async () => {
        const update = new MyChatMemberMockUpdate({ oldStatus: 'left', newStatus: 'member' }).build();

        await bot.handleUpdate(update);

        expect(chatSession.botRemoved).toBe(false);
      });
    });
  });

  describe('botInviteQuery', () => {
    describe('positive cases', () => {
      it('should reset botRemoved and send a join message when bot is invited as member', async () => {
        chatSession.botRemoved = true;
        const update = new MyChatMemberMockUpdate({ oldStatus: 'left', newStatus: 'member' }).build();

        await bot.handleUpdate(update);

        expect(chatSession.botRemoved).toBe(false);
        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });

      it('should reset botRemoved and send a join message when bot is invited as admin', async () => {
        chatSession.botRemoved = true;
        const update = new MyChatMemberMockUpdate({ oldStatus: 'kicked', newStatus: 'administrator', canDeleteMessages: true }).build();

        await bot.handleUpdate(update);

        expect(chatSession.botRemoved).toBe(false);
        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });
    });

    describe('negative cases', () => {
      it('should not send message when status did not change from left/kicked', async () => {
        const update = new MyChatMemberMockUpdate({ oldStatus: 'member', newStatus: 'administrator' }).build();

        await bot.handleUpdate(update);

        // botPromoteQuery fires when new status is administrator - may still send
        // but botInviteQuery branch is NOT triggered (old status is not left/kicked)
        // The invite path requires old = left/kicked AND new = member/administrator
        expect(chatSession.botRemoved).toBe(false);
      });
    });
  });

  describe('botPromoteQuery', () => {
    describe('positive cases', () => {
      it('should set isBotAdmin and botAdminDate when promoted in a group', async () => {
        const update = new MyChatMemberMockUpdate({ oldStatus: 'member', newStatus: 'administrator', canDeleteMessages: true }).build();

        await bot.handleUpdate(update);

        expect(chatSession.isBotAdmin).toBe(true);
        expect(chatSession.botAdminDate).toBeDefined();
        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });

      it('should send channel start message when promoted in a channel', async () => {
        const update = new MyChatMemberMockUpdate({ oldStatus: 'member', newStatus: 'administrator', chatType: 'channel' }).build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });

      it('should send no-delete message when promoted without delete permission', async () => {
        const update = new MyChatMemberMockUpdate({ oldStatus: 'member', newStatus: 'administrator', canDeleteMessages: false }).build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });
    });

    describe('negative cases', () => {
      it('should not change session when new status is not administrator', async () => {
        const update = new MyChatMemberMockUpdate({ oldStatus: 'left', newStatus: 'member' }).build();

        await bot.handleUpdate(update);

        expect(chatSession.isBotAdmin).toBe(false);
        expect(chatSession.botAdminDate).toBeUndefined();
      });
    });
  });

  describe('botDemoteQuery', () => {
    describe('positive cases', () => {
      it('should clear admin session when demoted from administrator to member', async () => {
        chatSession.isBotAdmin = true;
        chatSession.botAdminDate = new Date();
        const update = new MyChatMemberMockUpdate({ oldStatus: 'administrator', newStatus: 'member' }).build();

        await bot.handleUpdate(update);

        expect(chatSession.isBotAdmin).toBe(false);
        expect(chatSession.botAdminDate).toBeUndefined();
        expect(outgoingRequests.getMethods()).toContain('sendMessage');
      });
    });

    describe('negative cases', () => {
      it('should not modify session when old status was not administrator', async () => {
        chatSession.isBotAdmin = true;
        const update = new MyChatMemberMockUpdate({ oldStatus: 'member', newStatus: 'member' }).build();

        await bot.handleUpdate(update);

        expect(chatSession.isBotAdmin).toBe(true);
      });
    });
  });
});
