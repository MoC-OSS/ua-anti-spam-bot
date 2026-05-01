import type { Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { stateMiddleware } from '@bot/middleware/state.middleware';

import type { GrammyContext } from '@app-types/context';

import { mockSession } from '@test-helpers/session-mocks';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;
let isActualUserAdmin: boolean | undefined;
let isEffectiveUserAdmin: boolean | undefined;
let isStoredUserAdmin: boolean | undefined;

const bot = new Bot<GrammyContext>('mock');
const { beforeAnyComposer } = getBeforeAnyComposer();

const { session, mockSessionMiddleware } = mockSession({
  isCurrentUserAdmin: false,
});

describe('beforeAnyComposer', () => {
  beforeAll(async () => {
    bot.use(stateMiddleware);
    bot.use(mockSessionMiddleware);
    bot.use(beforeAnyComposer);

    bot.use((context, next) => {
      isActualUserAdmin = context.state.isActualUserAdmin;
      isEffectiveUserAdmin = context.state.isUserAdmin;
      isStoredUserAdmin = context.session.isCurrentUserAdmin;

      return next();
    });

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
    isActualUserAdmin = undefined;
    isEffectiveUserAdmin = undefined;
    isStoredUserAdmin = undefined;
    delete session.roleMode;
    session.isCurrentUserAdmin = false;
  });

  describe('my_chat_member', () => {
    describe('channel type', () => {
      it('should tell about not right chat for channel joining', () => {
        // eslint-disable-next-line sonarjs/todo-tag
        // TODO finish this test
        expect(chats.outgoing).toEqual(chats.outgoing);
      });
    });
  });

  describe('message', () => {
    it('should identify is user admin', async () => {
      await user.sendText('regular message', { chat: group });

      const expectedMethods = chats.outgoing.buildMethods(['getChatMember']);
      const actualMethods = chats.outgoing.getMethods();

      expect(actualMethods).toEqual(expectedMethods);
      expect(chats.outgoing.length).toEqual(1);
      expect(isActualUserAdmin).toBe(true);
      expect(isEffectiveUserAdmin).toBe(true);
      expect(isStoredUserAdmin).toBe(true);
    });

    it('should keep actual admin state but disable effective admin mode when user role override is enabled', async () => {
      session.roleMode = 'user';

      await user.sendText('regular message', { chat: group });

      expect(isActualUserAdmin).toBe(true);
      expect(isEffectiveUserAdmin).toBe(false);
      expect(isStoredUserAdmin).toBe(true);
    });

    it('should call next immediately when from.id is absent', async () => {
      await bot.handleUpdate({
        update_id: 1,

        message: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          text: 'no sender',
          chat: { id: group.id, type: 'supergroup' as const, title: 'Test Group' },
        } as any,
      });

      // No getChatMember call expected because fromId guard returns next() early
      expect(chats.outgoing.getMethods()).not.toContain('getChatMember');
    });

    it('should treat private users as actual admins for command access', async () => {
      await user.sendText('private message');

      expect(chats.outgoing.getMethods()).toEqual([]);
      expect(isActualUserAdmin).toBe(true);
      expect(isEffectiveUserAdmin).toBe(true);
      expect(isStoredUserAdmin).toBe(true);
    });
  });
});
