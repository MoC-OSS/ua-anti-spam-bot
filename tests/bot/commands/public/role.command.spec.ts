import { Bot } from 'grammy';

import { RoleCommand } from '@bot/commands/public/role.command';
import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { OutgoingRequests } from '@testing/outgoing-requests';
import type { ApiResponses } from '@testing/prepare';
import { prepareBotForTesting } from '@testing/prepare';
import { mockSession } from '@testing/testing-main';
import { MessagePrivateMockUpdate } from '@testing/updates/message-private-mock.update';
import { MessageMockUpdate } from '@testing/updates/message-super-group-mock.update';

import type { GrammyContext } from '@app-types/context';

let outgoingRequests: OutgoingRequests;
const bot = new Bot<GrammyContext>('mock');
const roleCommand = new RoleCommand();

const { session, mockSessionMiddleware } = mockSession({
  isCurrentUserAdmin: false,
});

const apiResponses: ApiResponses = {
  getChatMember: { status: 'creator' },
};

const commandName = '/role';
const commandText = '/role user';

/**
 * Builds a group /role update.
 * @param text - Command text to send.
 * @returns Telegram update payload.
 */
function getRoleCommandUpdate(text: string) {
  return new MessageMockUpdate(text).buildOverwrite({
    message: {
      entities: [{ offset: 0, length: commandName.length, type: 'bot_command' }],
    },
  });
}

/**
 * Builds a private /role update.
 * @param text - Command text to send.
 * @returns Telegram update payload.
 */
function getPrivateRoleCommandUpdate(text: string) {
  return new MessagePrivateMockUpdate(text).buildOverwrite({
    message: {
      entities: [{ offset: 0, length: commandName.length, type: 'bot_command' }],
    },
  });
}

describe('RoleCommand', () => {
  beforeAll(async () => {
    const { beforeAnyComposer } = getBeforeAnyComposer();

    bot.use(i18n);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(mockSessionMiddleware);
    bot.use(beforeAnyComposer);

    bot.command('role', roleCommand.middleware());

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, apiResponses);
  }, 5000);

  beforeEach(() => {
    outgoingRequests.clear();
    delete session.roleMode;
    session.isCurrentUserAdmin = false;

    if (apiResponses.getChatMember) {
      apiResponses.getChatMember.status = 'creator';
    }
  });

  it('should enable user test mode for chat admins', async () => {
    await bot.handleUpdate(getRoleCommandUpdate(commandText));

    expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember', 'sendMessage']));
    expect(session.roleMode).toBe('user');
  });

  it('should disable user test mode when switching back to admin', async () => {
    session.roleMode = 'user';

    await bot.handleUpdate(getRoleCommandUpdate('/role admin'));

    expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember', 'sendMessage']));
    expect(session.roleMode).toBeUndefined();
  });

  it('should reject the command for regular users', async () => {
    if (apiResponses.getChatMember) {
      apiResponses.getChatMember.status = 'member';
    }

    await bot.handleUpdate(getRoleCommandUpdate(commandText));

    expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember', 'sendMessage']));
    expect(session.roleMode).toBeUndefined();
  });

  it('should explain that /role must be used in a group when called in private', async () => {
    await bot.handleUpdate(getPrivateRoleCommandUpdate(commandText));

    expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['sendMessage']));
  });

  it('should toggle to user test mode when called without an argument', async () => {
    await bot.handleUpdate(getRoleCommandUpdate('/role'));

    expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember', 'sendMessage']));
    expect(session.roleMode).toBe('user');
  });

  it('should toggle back to admin mode when called without an argument while test mode is enabled', async () => {
    session.roleMode = 'user';

    await bot.handleUpdate(getRoleCommandUpdate('/role'));

    expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember', 'sendMessage']));
    expect(session.roleMode).toBeUndefined();
  });

  it('should reject unsupported role arguments', async () => {
    await bot.handleUpdate(getRoleCommandUpdate('/role moderator'));

    expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember', 'sendMessage']));
    expect(session.roleMode).toBeUndefined();
  });

  it('should reject anonymous admins because Telegram sends the command as GroupAnonymousBot', async () => {
    const update = getRoleCommandUpdate(commandText);

    if (!('message' in update) || !update.message?.from) {
      throw new Error('Expected message update with sender');
    }

    update.message.from.username = 'GroupAnonymousBot';

    await bot.handleUpdate(update);

    expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember', 'sendMessage']));
    expect(session.roleMode).toBeUndefined();
  });
});
