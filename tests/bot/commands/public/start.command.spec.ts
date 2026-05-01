import type { Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { StartCommand } from '@bot/commands/public/start.command';
import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession } from '@test-helpers/session-mocks';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;

const bot = new Bot<GrammyContext>('mock');
const startMiddleware = new StartCommand();

const { chatSession, mockChatSessionMiddleware } = mockChatSession({});

const chatAdmins = [
  {
    status: 'creator' as const,
    user: {
      id: 1_111_111,
      first_name: 'GrammyMock FirstName',
      last_name: 'GrammyMock LastName',
      username: 'GrammyMock_Username',
      is_bot: false,
    },
    custom_title: 'Super Creator Title',
    is_anonymous: false,
  },
  {
    status: 'administrator' as const,
    user: {
      id: 1_111_112,
      first_name: 'GrammyMock FirstName2',
      last_name: 'GrammyMock LastName2',
      username: 'GrammyMock_Username2',
      is_bot: false,
    },
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

describe('StartCommand', () => {
  beforeAll(async () => {
    const { beforeAnyComposer } = getBeforeAnyComposer();

    bot.use(i18n);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(beforeAnyComposer);
    bot.use(mockChatSessionMiddleware);

    bot.command('start', startMiddleware.middleware());

    ({ chats } = await prepareBot<GrammyContext>(bot, {
      responses: {
        getChatMember: { status: 'creator' },
        getChatAdministrators: chatAdmins,
      },
    }));

    user = chats.newUser();
    group = chats.newSupergroup();
  }, 5000);

  beforeEach(() => {
    chats.outgoing.clear();
    user.replies.clear();
    chatSession.isBotAdmin = true;
  });

  describe('private flow', () => {
    it('should reply with start message in a private chat', async () => {
      await user.sendCommand('/start');

      expect(chats.outgoing.getMethods()).toContain('sendMessage');
    });
  });

  describe('group flow', () => {
    describe('bot is not admin', () => {
      beforeEach(() => {
        chatSession.isBotAdmin = false;
      });

      it('should reply with group start message when bot is not admin', async () => {
        await user.sendCommand('/start', undefined, { chat: group });

        expect(chats.outgoing.getMethods()).toContain('getChatMember');
        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });
    });

    describe('bot is admin', () => {
      beforeEach(() => {
        chatSession.isBotAdmin = true;
      });

      it('should reply with group start message when bot is admin', async () => {
        await user.sendCommand('/start', undefined, { chat: group });

        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });
    });
  });
});
