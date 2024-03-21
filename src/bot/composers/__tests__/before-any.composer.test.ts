import { Bot } from 'grammy';

import type { OutgoingRequests } from '../../../testing';
import { MessageSuperGroupMockUpdate, prepareBotForTesting } from '../../../testing';
import type { GrammyContext } from '../../../types';
import { stateMiddleware } from '../../middleware';
import { getBeforeAnyComposer } from '../before-any.composer';

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
        // TODO finish this test
        expect(outgoingRequests).toEqual(outgoingRequests);
      });
    });
  });
  describe('message', () => {
    it('should identify is user admin', async () => {
      const update = new MessageSuperGroupMockUpdate('regular message').build();
      await bot.handleUpdate(update);
      const expectedMethods = outgoingRequests.buildMethods(['getChatMember']);
      const actualMethods = outgoingRequests.getMethods();
      expect(actualMethods).toEqual(expectedMethods);
      expect(outgoingRequests.length).toEqual(1);
    });
  });
});
