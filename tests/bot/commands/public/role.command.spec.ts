import type { Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { RoleCommand } from '@bot/commands/public/role.command';
import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { GrammyContext } from '@app-types/context';

import { mockSession } from '@test-helpers/session-mocks';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;

const bot = new Bot<GrammyContext>('mock');
const roleCommand = new RoleCommand();

const { session, mockSessionMiddleware } = mockSession({
  isCurrentUserAdmin: false,
});

describe('RoleCommand', () => {
  beforeAll(async () => {
    const { beforeAnyComposer } = getBeforeAnyComposer();

    bot.use(i18n);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(mockSessionMiddleware);
    bot.use(beforeAnyComposer);

    bot.command('role', roleCommand.middleware());

    ({ chats } = await prepareBot<GrammyContext>(bot, {
      responses: {
        getChatMember: { status: 'creator' },
      },
    }));

    user = chats.newUser();
    group = chats.newSupergroup();
  }, 5000);

  beforeEach(() => {
    chats.outgoing.clear();
    user.replies.clear();
    delete session.roleMode;
    session.isCurrentUserAdmin = false;
  });

  it('should enable user test mode for chat admins', async () => {
    await user.sendCommand('/role', 'user', { chat: group });

    expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember', 'sendMessage']));
    expect(session.roleMode).toBe('user');
  });

  it('should disable user test mode when switching back to admin', async () => {
    session.roleMode = 'user';

    await user.sendCommand('/role', 'admin', { chat: group });

    expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember', 'sendMessage']));
    expect(session.roleMode).toBeUndefined();
  });

  it('should reject the command for regular users', async () => {
    chats.outgoing.respondNext('getChatMember', { status: 'member' });
    await user.sendCommand('/role', 'user', { chat: group });

    expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember', 'sendMessage']));
    expect(session.roleMode).toBeUndefined();
  });

  it('should explain that /role must be used in a group when called in private', async () => {
    await user.sendCommand('/role', 'user');

    expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['sendMessage']));
  });

  it('should toggle to user test mode when called without an argument', async () => {
    await user.sendCommand('/role', undefined, { chat: group });

    expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember', 'sendMessage']));
    expect(session.roleMode).toBe('user');
  });

  it('should toggle back to admin mode when called without an argument while test mode is enabled', async () => {
    session.roleMode = 'user';

    await user.sendCommand('/role', undefined, { chat: group });

    expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember', 'sendMessage']));
    expect(session.roleMode).toBeUndefined();
  });

  it('should reject unsupported role arguments', async () => {
    await user.sendCommand('/role', 'moderator', { chat: group });

    expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember', 'sendMessage']));
    expect(session.roleMode).toBeUndefined();
  });

  it('should reject anonymous admins because Telegram sends the command as GroupAnonymousBot', async () => {
    await bot.handleUpdate({
      update_id: 1,
      message: {
        message_id: 1365,
        date: Math.floor(Date.now() / 1000),
        chat: { id: group.id, type: 'supergroup' as const, title: group.title },
        from: {
          id: 1_111_111,
          first_name: 'GrammyMock FirstName',
          last_name: 'GrammyMock LastName',
          username: 'GroupAnonymousBot',
          is_bot: false,
        },
        text: '/role user',
        entities: [{ offset: 0, length: '/role'.length, type: 'bot_command' as const }],
      },
    });

    expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember', 'sendMessage']));
    expect(session.roleMode).toBeUndefined();
  });
});
