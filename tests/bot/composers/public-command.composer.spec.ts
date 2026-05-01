import type { Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { getPublicCommandsComposer } from '@bot/composers/public-command.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession, mockSession } from '@test-helpers/session-mocks';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;

const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({});

const { session, mockSessionMiddleware } = mockSession({
  isCurrentUserAdmin: false,
});

describe('PublicCommandsComposer', () => {
  beforeAll(async () => {
    const { beforeAnyComposer } = getBeforeAnyComposer();
    const { publicCommandsComposer } = getPublicCommandsComposer({ startTime: new Date('2026-03-18T00:00:00.000Z') });

    bot.use(i18n);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(mockSessionMiddleware);
    bot.use(beforeAnyComposer);
    bot.use(mockChatSessionMiddleware);
    bot.use(publicCommandsComposer);

    ({ chats } = await prepareBot<GrammyContext>(bot, {
      responses: {
        getChatMember: { status: 'creator' },
        getChatAdministrators: [
          {
            status: 'creator',
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
            status: 'administrator',
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
        ],
      },
    }));

    user = chats.newUser();
    group = chats.newSupergroup();
  }, 5000);

  beforeEach(() => {
    chats.outgoing.clear();
    user.replies.clear();
    chatSession.isBotAdmin = true;
    chatSession.language = undefined;
    delete session.roleMode;
    session.isCurrentUserAdmin = false;
  });

  describe('handled commands', () => {
    it('should delete the incoming /language command before replying', async () => {
      await user.sendCommand('/language', undefined, { chat: group });

      expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember', 'deleteMessage', 'sendMessage']));
    });

    it('should delete the incoming /status command before replying', async () => {
      await user.sendCommand('/status', undefined, { chat: group });

      expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember', 'deleteMessage', 'sendMessage']));
    });

    it('should delete the incoming /role command before replying', async () => {
      await user.sendCommand('/role', undefined, { chat: group });

      expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember', 'deleteMessage', 'sendMessage']));
    });
  });

  describe('non-command messages', () => {
    it('should not delete plain user messages that are not handled by the public commands composer', async () => {
      await user.sendText('hello', { chat: group });

      expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember']));
    });
  });
});
