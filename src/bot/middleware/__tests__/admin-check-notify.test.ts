import { hydrateReply } from '@grammyjs/parse-mode';
import { Bot } from 'grammy';

// eslint-disable-next-line jest/no-mocks-import
import { realSwindlerMessage } from '../../../__mocks__/bot.mocks';
import type { ApiResponses, OutgoingRequests } from '../../../testing';
import { MessageMockUpdate, prepareBotForTesting } from '../../../testing';
import { mockChatSession, mockState } from '../../../testing-main';
import type { GrammyContext } from '../../../types';
import { getBeforeAnyComposer } from '../../composers';
import { selfDestructedReply } from '../../plugins';
import { adminCheckNotify, stateMiddleware } from '..';

let outgoingRequests: OutgoingRequests;

const { beforeAnyComposer } = getBeforeAnyComposer();
const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({});
const { state, mockStateMiddleware } = mockState({});

const apiResponses: ApiResponses = {
  getChatMember: {
    status: 'administrator',
  },
};
describe('admin-check-notify', () => {
  beforeEach(() => {
    outgoingRequests.clear();
  });

  beforeAll(async () => {
    bot.use(mockChatSessionMiddleware);
    bot.use(mockStateMiddleware);
    bot.use(stateMiddleware);
    chatSession.isCheckAdminNotified = false;
    state.isDeleted = true;
    bot.use(beforeAnyComposer);
    bot.use(hydrateReply);
    bot.use(selfDestructedReply());
    bot.use(adminCheckNotify);
    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, apiResponses);
  }, 5000);

  it('should notify admin in case if admin swindler message deleted', async () => {
    const update = new MessageMockUpdate(realSwindlerMessage).build();
    await bot.handleUpdate(update);
    const expectedMethods = outgoingRequests.buildMethods(['getChatMember', 'sendMessage']);
    const actualMethods = outgoingRequests.getMethods();
    expect(actualMethods).toEqual(expectedMethods);
    expect(outgoingRequests.length).toEqual(2);
  });
});
