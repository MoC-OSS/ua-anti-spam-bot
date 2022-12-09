import { Bot } from 'grammy';

import type { OutgoingRequests } from '../../../testing';
import { prepareBotForTesting } from '../../../testing';
import type { GrammyContext } from '../../../types';
import { getBeforeAnyComposer } from '../before-any.composer';

let outgoingRequests: OutgoingRequests;
const bot = new Bot<GrammyContext>('mock');
const { beforeAnyComposer } = getBeforeAnyComposer();

describe('beforeAnyComposer', () => {
  beforeAll(async () => {
    // bot.use(stateMiddleware);
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
});
