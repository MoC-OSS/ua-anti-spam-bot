import { Bot } from 'grammy';

import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { stateMiddleware } from '@bot/middleware/state.middleware';

import type { OutgoingRequests } from '@testing/outgoing-requests';
import { prepareBotForTesting } from '@testing/prepare';
import { MessageMockUpdate } from '@testing/updates/message-super-group-mock.update';

import type { GrammyContext } from '@app-types/context';

let outgoingRequests: OutgoingRequests;

const bot = new Bot<GrammyContext>('mock');
const { beforeAnyComposer } = getBeforeAnyComposer();

describe('beforeAnyComposer', () => {
  beforeEach(() => {
    outgoingRequests.clear();
  });

  beforeAll(async () => {
    bot.use(stateMiddleware);
    bot.use(beforeAnyComposer);
    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot);
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
    });

    it('should call next immediately when from.id is absent', async () => {
      const updateConstructor = new MessageMockUpdate('no sender');
      const update = updateConstructor.buildOverwrite({ message: { from: undefined } });

      await bot.handleUpdate(update);

      // No getChatMember call expected because fromId guard returns next() early
      expect(outgoingRequests.getMethods()).not.toContain('getChatMember');
    });
  });
});
