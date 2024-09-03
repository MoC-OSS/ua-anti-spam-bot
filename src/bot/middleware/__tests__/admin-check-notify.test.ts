import { hydrateReply } from '@grammyjs/parse-mode';
import { Bot } from 'grammy';

// eslint-disable-next-line jest/no-mocks-import
import { realSwindlerMessage } from '../../../__mocks__/bot.mocks';
import type { ApiResponses, OutgoingRequests } from '../../../testing';
import { MessageMockUpdate, prepareBotForTesting } from '../../../testing';
import { mockChatSession, mockState } from '../../../testing-main';
import type { GrammyContext } from '../../../types';
import { getBeforeAnyComposer } from '../../composers';
import { getNoCardsComposer } from '../../composers/messages';
import { selfDestructedReply } from '../../plugins';
import { adminCheckNotify, onlyNotAdmin, parseCards, parseText, stateMiddleware } from '..';

let outgoingRequests: OutgoingRequests;

const { beforeAnyComposer } = getBeforeAnyComposer();
const { noCardsComposer } = getNoCardsComposer();
const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({
  chatSettings: {
    enableDeleteCards: true,
  },
});
const { state, mockStateMiddleware } = mockState({});

const apiResponses: ApiResponses = {
  getChatMember: {
    status: 'creator',
  },
  getChat: {
    invite_link: '',
  },
};
describe('admin-check-notify', () => {
  beforeEach(() => {
    outgoingRequests.clear();
  });

  beforeAll(async () => {
    bot.use(mockChatSessionMiddleware);
    bot.use(mockStateMiddleware);
    bot.use(beforeAnyComposer);
    bot.use(stateMiddleware);
    bot.use(hydrateReply);
    bot.use(selfDestructedReply());
    bot.use(adminCheckNotify);
    bot.use(parseText);
    bot.use(parseCards);
    bot.use(onlyNotAdmin);
    bot.use(noCardsComposer);
    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, apiResponses);
  }, 5000);

  it('should remove a card message for admin if admin check enabled', async () => {
    chatSession.chatSettings.enableAdminCheck = true;
    const update = new MessageMockUpdate('4111 1111 1111 1111').build();
    await bot.handleUpdate(update);
    const expectedMethods = outgoingRequests.buildMethods(['getChatMember', 'deleteMessage', 'getChat', 'sendMessage', 'sendMessage']);
    const actualMethods = outgoingRequests.getMethods();
    expect(expectedMethods).toEqual(actualMethods);
    expect(outgoingRequests.length).toEqual(5);
  });
  it('should not remove a card message for admin if admin check disabled', async () => {
    chatSession.chatSettings.enableAdminCheck = false;
    const update = new MessageMockUpdate('4111 1111 1111 1111').build();
    await bot.handleUpdate(update);
    const expectedMethods = outgoingRequests.buildMethods(['getChatMember']);
    const actualMethods = outgoingRequests.getMethods();
    expect(expectedMethods).toEqual(actualMethods);
    expect(outgoingRequests.length).toEqual(1);
  });
  it('should notify admin in case if admin swindler message deleted', async () => {
    chatSession.isCheckAdminNotified = false;
    state.isDeleted = true;
    const update = new MessageMockUpdate(realSwindlerMessage).build();
    await bot.handleUpdate(update);
    const expectedMethods = outgoingRequests.buildMethods(['getChatMember', 'sendMessage']);
    const actualMethods = outgoingRequests.getMethods();
    expect(actualMethods).toEqual(expectedMethods);
    expect(outgoingRequests.length).toEqual(2);
  });
});
