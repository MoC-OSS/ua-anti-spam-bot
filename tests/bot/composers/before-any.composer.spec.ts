import { Bot } from 'grammy';

import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { stateMiddleware } from '@bot/middleware/state.middleware';

import type { OutgoingRequests } from '@testing/outgoing-requests';
import { prepareBotForTesting } from '@testing/prepare';
import { mockSession } from '@testing/testing-main';
import { MessagePrivateMockUpdate } from '@testing/updates/message-private-mock.update';
import { MessageMockUpdate } from '@testing/updates/message-super-group-mock.update';

import type { GrammyContext } from '@app-types/context';

let outgoingRequests: OutgoingRequests;
let isActualUserAdmin: boolean | undefined;
let isEffectiveUserAdmin: boolean | undefined;
let isStoredUserAdmin: boolean | undefined;

const bot = new Bot<GrammyContext>('mock');
const { beforeAnyComposer } = getBeforeAnyComposer();

const { session, mockSessionMiddleware } = mockSession({
  isCurrentUserAdmin: false,
});

describe('beforeAnyComposer', () => {
  beforeEach(() => {
    outgoingRequests.clear();
    isActualUserAdmin = undefined;
    isEffectiveUserAdmin = undefined;
    isStoredUserAdmin = undefined;
    delete session.roleMode;
    session.isCurrentUserAdmin = false;
  });

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

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, {
      getChatMember: { status: 'creator' },
    });
  }, 5000);

  describe('my_chat_member', () => {
    describe('channel type', () => {
      it('should tell about not right chat for channel joining', () => {
        // eslint-disable-next-line sonarjs/todo-tag
        // TODO finish this test
        expect(outgoingRequests).toEqual(outgoingRequests);
      });
    });
  });

  describe('message', () => {
    it('should identify is user admin', async () => {
      const update = new MessageMockUpdate('regular message').build();

      await bot.handleUpdate(update);
      const expectedMethods = outgoingRequests.buildMethods(['getChatMember']);
      const actualMethods = outgoingRequests.getMethods();

      expect(actualMethods).toEqual(expectedMethods);
      expect(outgoingRequests.length).toEqual(1);
      expect(isActualUserAdmin).toBe(true);
      expect(isEffectiveUserAdmin).toBe(true);
      expect(isStoredUserAdmin).toBe(true);
    });

    it('should keep actual admin state but disable effective admin mode when user role override is enabled', async () => {
      session.roleMode = 'user';

      const update = new MessageMockUpdate('regular message').build();

      await bot.handleUpdate(update);

      expect(isActualUserAdmin).toBe(true);
      expect(isEffectiveUserAdmin).toBe(false);
      expect(isStoredUserAdmin).toBe(true);
    });

    it('should call next immediately when from.id is absent', async () => {
      const updateConstructor = new MessageMockUpdate('no sender');
      const update = updateConstructor.buildOverwrite({ message: { from: undefined } });

      await bot.handleUpdate(update);

      // No getChatMember call expected because fromId guard returns next() early
      expect(outgoingRequests.getMethods()).not.toContain('getChatMember');
    });

    it('should treat private users as actual admins for command access', async () => {
      const update = new MessagePrivateMockUpdate('private message').build();

      await bot.handleUpdate(update);

      expect(outgoingRequests.getMethods()).toEqual([]);
      expect(isActualUserAdmin).toBe(true);
      expect(isEffectiveUserAdmin).toBe(true);
      expect(isStoredUserAdmin).toBe(true);
    });
  });
});
