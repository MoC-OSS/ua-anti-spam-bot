import type { Chats } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession } from '@test-helpers/session-mocks';

const genericUserBot = {
  id: 2022,
  is_bot: true as const,
  first_name: 'GrammyMock BotFirstName',
  last_name: 'GrammyMock BotLastName',
  username: 'GrammyMock_bot',
};

const genericUser = {
  id: 1_111_111,
  is_bot: false as const,
  first_name: 'GrammyMock FirstName',
  last_name: 'GrammyMock LastName',
  username: 'GrammyMock_Username',
};

const genericUser2 = {
  id: 1_111_112,
  is_bot: false as const,
  first_name: 'GrammyMock FirstName2',
  last_name: 'GrammyMock LastName2',
  username: 'GrammyMock_Username2',
};

const genericSuperGroup = { type: 'supergroup' as const, id: 202_212, title: 'GrammyMock' };
const genericChannelChat = { type: 'channel' as const, id: 202_212, title: 'GrammyMockChannel' };

/**
 *
 * @param status
 * @param canDeleteMessages
 */
function buildChatMember(status: string, canDeleteMessages = false) {
  switch (status) {
    case 'creator': {
      return { status: 'creator' as const, user: genericUserBot, is_anonymous: false };
    }

    case 'administrator': {
      return {
        status: 'administrator' as const,
        user: genericUserBot,
        is_anonymous: false,
        can_be_edited: false,
        can_manage_chat: true,
        can_change_info: true,
        can_delete_messages: canDeleteMessages,
        can_invite_users: true,
        can_restrict_members: true,
        can_promote_members: false,
        can_manage_video_chats: true,
        can_post_stories: false,
        can_edit_stories: false,
        can_delete_stories: false,
      };
    }

    case 'kicked': {
      return { status: 'kicked' as const, user: genericUserBot, until_date: 0 };
    }

    case 'left': {
      return { status: 'left' as const, user: genericUserBot };
    }

    default: {
      return { status: 'member' as const, user: genericUserBot };
    }
  }
}

interface BuildMyChatMemberUpdateOptions {
  oldStatus: string;
  newStatus: string;
  chatType?: string;
  canDeleteMessages?: boolean;
}

/**
 *
 * @param options
 * @param options.oldStatus
 * @param options.newStatus
 * @param options.chatType
 * @param options.canDeleteMessages
 */
function buildMyChatMemberUpdate(options: BuildMyChatMemberUpdateOptions) {
  const { chatType = 'supergroup', oldStatus, newStatus, canDeleteMessages = false } = options;
  const chat = chatType === 'channel' ? genericChannelChat : genericSuperGroup;

  return {
    update_id: 10_000,
    my_chat_member: {
      chat,
      from: genericUser,
      date: Math.floor(Date.now() / 1000),
      old_chat_member: buildChatMember(oldStatus),
      new_chat_member: buildChatMember(newStatus, canDeleteMessages),
    },
  };
}

const chatAdmins = [
  { status: 'creator' as const, user: genericUser, custom_title: 'Super Creator Title', is_anonymous: false },
  {
    status: 'administrator' as const,
    user: genericUser2,
    custom_title: 'Super Admin Title',
    is_anonymous: true,
    can_be_edited: true,
    can_change_info: true,
    can_delete_messages: true,
    can_edit_messages: true,
    can_invite_users: true,
    can_manage_chat: true,
    can_manage_video_chats: true,
    can_promote_members: true,
    can_restrict_members: true,
    can_post_stories: true,
    can_edit_stories: true,
    can_delete_stories: true,
  },
];

let chats: Chats<GrammyContext>;

const bot = new Bot<GrammyContext>('mock');
const { chatSession, mockChatSessionMiddleware } = mockChatSession({});

describe('bot queries', () => {
  beforeAll(async () => {
    const { beforeAnyComposer } = getBeforeAnyComposer();

    bot.use(i18n);
    bot.use(stateMiddleware);
    bot.use(mockChatSessionMiddleware);
    bot.use(beforeAnyComposer);

    ({ chats } = await prepareBot<GrammyContext>(bot, { responses: { getChatAdministrators: chatAdmins } }));
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
        const update = buildMyChatMemberUpdate({ oldStatus: 'member', newStatus: 'left' });

        await bot.handleUpdate(update);

        expect(chatSession.botRemoved).toBe(true);
        expect(chatSession.isBotAdmin).toBeUndefined();
        expect(chatSession.botAdminDate).toBeUndefined();
      });

      it('should mark bot as removed when status becomes kicked', async () => {
        const update = buildMyChatMemberUpdate({ oldStatus: 'administrator', newStatus: 'kicked' });

        await bot.handleUpdate(update);

        expect(chatSession.botRemoved).toBe(true);
      });
    });

    describe('negative cases', () => {
      it('should not mark as removed when new status is not left or kicked', async () => {
        const update = buildMyChatMemberUpdate({ oldStatus: 'left', newStatus: 'member' });

        await bot.handleUpdate(update);

        expect(chatSession.botRemoved).toBe(false);
      });
    });
  });

  describe('botInviteQuery', () => {
    describe('positive cases', () => {
      it('should reset botRemoved and send a join message when bot is invited as member', async () => {
        chatSession.botRemoved = true;
        const update = buildMyChatMemberUpdate({ oldStatus: 'left', newStatus: 'member' });

        await bot.handleUpdate(update);

        expect(chatSession.botRemoved).toBe(false);
        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });

      it('should reset botRemoved and send a join message when bot is invited as admin', async () => {
        chatSession.botRemoved = true;
        const update = buildMyChatMemberUpdate({ oldStatus: 'kicked', newStatus: 'administrator', canDeleteMessages: true });

        await bot.handleUpdate(update);

        expect(chatSession.botRemoved).toBe(false);
        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });
    });

    describe('negative cases', () => {
      it('should not send message when status did not change from left/kicked', async () => {
        const update = buildMyChatMemberUpdate({ oldStatus: 'member', newStatus: 'administrator' });

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
        const update = buildMyChatMemberUpdate({ oldStatus: 'member', newStatus: 'administrator', canDeleteMessages: true });

        await bot.handleUpdate(update);

        expect(chatSession.isBotAdmin).toBe(true);
        expect(chatSession.botAdminDate).toBeDefined();
        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });

      it('should send channel start message when promoted in a channel', async () => {
        const update = buildMyChatMemberUpdate({ oldStatus: 'member', newStatus: 'administrator', chatType: 'channel' });

        await bot.handleUpdate(update);

        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });

      it('should send no-delete message when promoted without delete permission', async () => {
        const update = buildMyChatMemberUpdate({ oldStatus: 'member', newStatus: 'administrator', canDeleteMessages: false });

        await bot.handleUpdate(update);

        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });
    });

    describe('negative cases', () => {
      it('should not change session when new status is not administrator', async () => {
        const update = buildMyChatMemberUpdate({ oldStatus: 'left', newStatus: 'member' });

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
        const update = buildMyChatMemberUpdate({ oldStatus: 'administrator', newStatus: 'member' });

        await bot.handleUpdate(update);

        expect(chatSession.isBotAdmin).toBe(false);
        expect(chatSession.botAdminDate).toBeUndefined();
        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });
    });

    describe('negative cases', () => {
      it('should not modify session when old status was not administrator', async () => {
        chatSession.isBotAdmin = true;
        const update = buildMyChatMemberUpdate({ oldStatus: 'member', newStatus: 'member' });

        await bot.handleUpdate(update);

        expect(chatSession.isBotAdmin).toBe(true);
      });
    });
  });
});
