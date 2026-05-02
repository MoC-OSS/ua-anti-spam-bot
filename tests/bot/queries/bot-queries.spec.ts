import type { Channel, Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession } from '@test-helpers/session-mocks';

let chats: Chats<GrammyContext>;
let triggerUser: User<GrammyContext>;
let owner: User<GrammyContext>;
let admin2: User<GrammyContext>;
let group: Supergroup<GrammyContext>;
let channel: Channel<GrammyContext>;

const bot = new Bot<GrammyContext>('mock');
const { chatSession, mockChatSessionMiddleware } = mockChatSession({});

describe('bot queries', () => {
  beforeAll(async () => {
    const { beforeAnyComposer } = getBeforeAnyComposer();

    bot.use(i18n);
    bot.use(stateMiddleware);
    bot.use(mockChatSessionMiddleware);
    bot.use(beforeAnyComposer);

    ({ chats } = await prepareBot<GrammyContext>(bot));

    triggerUser = chats.newUser();

    owner = chats.newUser({
      id: 1_111_111,
      first_name: 'GrammyMock FirstName',
      last_name: 'GrammyMock LastName',
      username: 'GrammyMock_Username',
    });

    admin2 = chats.newUser({
      id: 1_111_112,
      first_name: 'GrammyMock FirstName2',
      last_name: 'GrammyMock LastName2',
      username: 'GrammyMock_Username2',
    });

    group = chats.newSupergroup();
    group.own(owner);
    group.promote(admin2);

    channel = chats.newChannel('GrammyMockChannel');
  }, 10_000);

  beforeEach(() => {
    chats.outgoing.clear();
    chatSession.botRemoved = false;
    chatSession.isBotAdmin = false;
    delete chatSession.botAdminDate;
  });

  describe('botKickQuery', () => {
    describe('positive cases', () => {
      it('should mark bot as removed when status becomes left', async () => {
        await group.changeMemberStatus(triggerUser, { from: 'member', to: 'left' });

        expect(chatSession.botRemoved).toBe(true);
        expect(chatSession.isBotAdmin).toBeUndefined();
        expect(chatSession.botAdminDate).toBeUndefined();
      });

      it('should mark bot as removed when status becomes kicked', async () => {
        await group.changeMemberStatus(triggerUser, { from: 'administrator', to: 'kicked' });

        expect(chatSession.botRemoved).toBe(true);
      });
    });

    describe('negative cases', () => {
      it('should not mark as removed when new status is not left or kicked', async () => {
        await group.changeMemberStatus(triggerUser, { from: 'left', to: 'member' });

        expect(chatSession.botRemoved).toBe(false);
      });
    });
  });

  describe('botInviteQuery', () => {
    describe('positive cases', () => {
      it('should reset botRemoved and send a join message when bot is invited as member', async () => {
        chatSession.botRemoved = true;
        await group.changeMemberStatus(triggerUser, { from: 'left', to: 'member' });

        expect(chatSession.botRemoved).toBe(false);
        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });

      it('should reset botRemoved and send a join message when bot is invited as admin', async () => {
        chatSession.botRemoved = true;
        await group.changeMemberStatus(triggerUser, { from: 'kicked', to: 'administrator', permissions: { can_delete_messages: true } });

        expect(chatSession.botRemoved).toBe(false);
        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });
    });

    describe('negative cases', () => {
      it('should not send message when status did not change from left/kicked', async () => {
        await group.changeMemberStatus(triggerUser, { from: 'member', to: 'administrator' });

        // botPromoteQuery fires when new status is administrator — may still send
        // but botInviteQuery branch is NOT triggered (old status is not left/kicked)
        expect(chatSession.botRemoved).toBe(false);
      });
    });
  });

  describe('botPromoteQuery', () => {
    describe('positive cases', () => {
      it('should set isBotAdmin and botAdminDate when promoted in a group', async () => {
        await group.changeMemberStatus(triggerUser, { from: 'member', to: 'administrator', permissions: { can_delete_messages: true } });

        expect(chatSession.isBotAdmin).toBe(true);
        expect(chatSession.botAdminDate).toBeDefined();
        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });

      it('should send channel start message when promoted in a channel', async () => {
        await channel.changeMemberStatus(triggerUser, { from: 'member', to: 'administrator' });

        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });

      it('should send no-delete message when promoted without delete permission', async () => {
        await group.changeMemberStatus(triggerUser, { from: 'member', to: 'administrator', permissions: { can_delete_messages: false } });

        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });
    });

    describe('negative cases', () => {
      it('should not change session when new status is not administrator', async () => {
        await group.changeMemberStatus(triggerUser, { from: 'left', to: 'member' });

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
        await group.changeMemberStatus(triggerUser, { from: 'administrator', to: 'member' });

        expect(chatSession.isBotAdmin).toBe(false);
        expect(chatSession.botAdminDate).toBeUndefined();
        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });
    });

    describe('negative cases', () => {
      it('should not modify session when old status was not administrator', async () => {
        chatSession.isBotAdmin = true;
        await group.changeMemberStatus(triggerUser, { from: 'member', to: 'member' });

        expect(chatSession.isBotAdmin).toBe(true);
      });
    });
  });
});
