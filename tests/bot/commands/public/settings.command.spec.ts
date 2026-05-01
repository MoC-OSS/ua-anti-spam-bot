import type { Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { SettingsCommand } from '@bot/commands/public/settings.command';
import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import { mockRedisService } from '@services/_mocks/index.mocks';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession } from '@test-helpers/session-mocks';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;

const bot = new Bot<GrammyContext>('mock');
const settingsMiddleware = new SettingsCommand(mockRedisService);

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

const getUserSessionSpy = vi.spyOn(mockRedisService, 'getUserSession');
const setUserSessionSpy = vi.spyOn(mockRedisService, 'setUserSession');

describe('SettingsCommand', () => {
  beforeAll(async () => {
    const { beforeAnyComposer } = getBeforeAnyComposer();

    bot.use(i18n);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(beforeAnyComposer);
    bot.use(mockChatSessionMiddleware);

    bot.command('settings', settingsMiddleware.middleware());

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
    setUserSessionSpy.mockClear();
  });

  describe('private flow', () => {
    it('should send not available settings if there are no linked chats', async () => {
      getUserSessionSpy.mockReturnValueOnce(
        Promise.resolve({
          id: '',
          payload: {
            isCurrentUserAdmin: false,
          },
          linkedChats: [],
        }),
      );

      await user.sendCommand('/settings');

      const expectedMethods = chats.outgoing.buildMethods(['sendMessage']);
      const actualMethods = chats.outgoing.getMethods();

      expect(expectedMethods).toEqual(actualMethods);
      expect(chats.outgoing.getAll<'sendMessage'>()[0]?.payload.text).toEqual(i18n.t('uk', 'settings-has-no-linked-chats'));
    });

    it('should send link if there are linked chats', async () => {
      getUserSessionSpy.mockReturnValueOnce(
        Promise.resolve({
          id: '',
          payload: {
            isCurrentUserAdmin: false,
          },
          linkedChats: [{ id: '', name: '' }],
        }),
      );

      await user.sendCommand('/settings');

      const expectedMethods = chats.outgoing.buildMethods(['sendMessage']);
      const actualMethods = chats.outgoing.getMethods();

      expect(expectedMethods).toEqual(actualMethods);
      expect(chats.outgoing.getAll<'sendMessage'>()[0]?.payload.text).not.toEqual(i18n.t('uk', 'settings-has-no-linked-chats'));
    });
  });

  describe('group flow', () => {
    it('should not allow to call settings for a regular user', async () => {
      chats.outgoing.respondNext('getChatMember', { status: 'member' });
      await user.sendCommand('/settings', undefined, { chat: group });

      const expectedMethods = chats.outgoing.buildMethods(['getChatMember', 'sendMessage']);
      const actualMethods = chats.outgoing.getMethods();

      expect(expectedMethods).toEqual(actualMethods);
    });

    it('should not allow to call settings for an admin if bot is not admin', async () => {
      chatSession.isBotAdmin = false;

      await user.sendCommand('/settings', undefined, { chat: group });

      const expectedMethods = chats.outgoing.buildMethods(['getChatMember', 'sendMessage']);
      const actualMethods = chats.outgoing.getMethods();

      expect(expectedMethods).toEqual(actualMethods);
    });

    it('should add all admins when a regular admin calls', async () => {
      await user.sendCommand('/settings', undefined, { chat: group });

      const expectedMethods = chats.outgoing.buildMethods(['getChatMember', 'getChatAdministrators', 'sendMessage']);
      const actualMethods = chats.outgoing.getMethods();

      expect(expectedMethods).toEqual(actualMethods);
      expect(setUserSessionSpy).toHaveBeenCalledTimes(chatAdmins.length);

      expect(setUserSessionSpy).toHaveBeenNthCalledWith(1, chatAdmins[0].user.id.toString(), {
        payload: { isCurrentUserAdmin: false },
        id: chatAdmins[0].user.id.toString(),
        linkedChats: [{ id: group.id.toString(), name: group.title }],
      });

      expect(setUserSessionSpy).toHaveBeenNthCalledWith(2, chatAdmins[1].user.id.toString(), {
        payload: { isCurrentUserAdmin: false },
        id: chatAdmins[1].user.id.toString(),
        linkedChats: [{ id: group.id.toString(), name: group.title }],
      });
    });
  });
});
