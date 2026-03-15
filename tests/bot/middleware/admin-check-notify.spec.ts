import { Bot } from 'grammy';

import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { getNoCardsComposer } from '@bot/composers/messages/no-cards.composer';
import { adminCheckNotify } from '@bot/middleware/admin-check-notify.middleware';
import { onlyNotAdmin } from '@bot/middleware/only-not-admin.middleware';
import { parseCards } from '@bot/middleware/parse-cards.middleware';
import { parseText } from '@bot/middleware/parse-text.middleware';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import { mockChatSession, mockState } from '@testing/../testing-main';
import type { OutgoingRequests } from '@testing/outgoing-requests';
import type { ApiResponses } from '@testing/prepare';
import { prepareBotForTesting } from '@testing/prepare';
import { MessageMockUpdate } from '@testing/updates/message-super-group-mock.update';

import type { GrammyContext } from '@app-types/context';

import { i18n } from '../../../src/i18n';
// eslint-disable-next-line vitest/no-mocks-import
import { realSwindlerMessage } from '../../__mocks__/bot.mocks';

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
    bot.use(i18n);
    bot.use(mockChatSessionMiddleware);
    bot.use(mockStateMiddleware);
    bot.use(beforeAnyComposer);
    bot.use(stateMiddleware);
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
