// it('should notify admin in case if admin swindler message deleted', async () => {
//   const apiResponses: ApiResponses = {
//     getChatMember: {
//       status: 'creator',
//     },
//   };
//   if (apiResponses.getChatMember) {
//     apiResponses.getChatMember.status = 'creator';
//   }
//   // outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, apiResponses);
//   const { beforeAnyComposer } = getBeforeAnyComposer();
//   chatSession.isCheckAdminNotified = false;
//   bot.use(hydrateReply);
//   bot.use(selfDestructedReply());
//   bot.use(stateMiddleware);
//   bot.use(beforeAnyComposer);
//   bot.use(adminCheckNotify);
//   const update = new MessageSuperGroupMockUpdate(realSwindlerMessage).setUserAsAdmin().build();
//   await bot.handleUpdate(update);
//   const expectedMethods = outgoingRequests.buildMethods(['getChatMember']);
//   const actualMethods = outgoingRequests.getMethods();
//   // console.info(actualMethods);
//   expect(actualMethods).toEqual(expectedMethods);
//   expect(outgoingRequests.length).toEqual(2);
// });

import { hydrateReply } from '@grammyjs/parse-mode';
import { Bot } from 'grammy';

// eslint-disable-next-line jest/no-mocks-import
import { realSwindlerMessage } from '../../../__mocks__/bot.mocks';
import type { ApiResponses, OutgoingRequests } from '../../../testing';
import { MessageSuperGroupMockUpdate, prepareBotForTesting } from '../../../testing';
import { mockChatSession } from '../../../testing-main';
import type { GrammyContext } from '../../../types';
import { getBeforeAnyComposer } from '../../composers';
import { selfDestructedReply } from '../../plugins';
import { adminCheckNotify, stateMiddleware } from '..';

let outgoingRequests: OutgoingRequests;

const { beforeAnyComposer } = getBeforeAnyComposer();
const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({});

describe('admin-check-notify', () => {
  beforeEach(() => {
    bot.use(mockChatSessionMiddleware);
    bot.use(hydrateReply);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(beforeAnyComposer);
    bot.use(adminCheckNotify);
    outgoingRequests.clear();
  });

  beforeAll(async () => {
    const apiResponses: ApiResponses = {
      getChatMember: {
        status: 'creator',
      },
    };
    if (apiResponses.getChatMember) {
      apiResponses.getChatMember.status = 'creator';
    }
    bot.use(stateMiddleware);
    bot.use(beforeAnyComposer);

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, apiResponses);
  }, 5000);

  it('should notify admin in case if admin swindler message deleted', async () => {
    chatSession.isCheckAdminNotified = false;
    const update = new MessageSuperGroupMockUpdate(realSwindlerMessage).setUserAsAdmin().build();
    await bot.handleUpdate(update);
    const expectedMethods = outgoingRequests.buildMethods(['getChatMember']);
    const actualMethods = outgoingRequests.getMethods();
    expect(actualMethods).toEqual(expectedMethods);
    expect(outgoingRequests.length).toEqual(2);
  });
});
