import { Bot } from 'grammy';

import { getMessagesRegisterComposer } from '../bot/composers';
import { getNoCardsComposer } from '../bot/composers/messages';
import { parseCards, stateMiddleware } from '../bot/middleware';
import { selfDestructedReply } from '../bot/plugins';
import type { OutgoingRequests } from '../testing';
import { MessagePrivateMockUpdate, prepareBotForTesting } from '../testing';
import { mockChatSession } from '../testing-main';
import type { GrammyContext } from '../types';

let outgoingRequests: OutgoingRequests;
const bot = new Bot<GrammyContext>('mock');

const { mockChatSessionMiddleware } = mockChatSession({
  chatSettings: {
    enableDeleteCards: true,
  },
});

describe('edit message test', () => {
  beforeAll(async () => {
    const { noCardsComposer } = getNoCardsComposer();
    const { messagesComposer, registerModule } = getMessagesRegisterComposer();

    registerModule(parseCards, noCardsComposer);

    bot.use(stateMiddleware);
    bot.use(selfDestructedReply());
    bot.use(mockChatSessionMiddleware);
    bot.use(messagesComposer);

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, {
      getChat: {
        invite_link: '',
      },
    });
  }, 5000);

  beforeEach(() => {
    outgoingRequests.clear();
  });

  it('should remove a card message', async () => {
    const update = new MessagePrivateMockUpdate('4111 1111 1111 1111').build();
    await bot.handleUpdate(update);

    const expectedMethods = outgoingRequests.buildMethods(['deleteMessage', 'getChat', 'sendMessage', 'sendMessage']);

    const actualMethods = outgoingRequests.getMethods();

    expect(expectedMethods).toEqual(actualMethods);
  });

  it('should not remove a card message', async () => {
    const update = new MessagePrivateMockUpdate('not a card').build();
    await bot.handleUpdate(update);

    const expectedMethods = outgoingRequests.buildMethods([]);

    const actualMethods = outgoingRequests.getMethods();

    expect(expectedMethods).toEqual(actualMethods);
  });

  it('should remove the message if it has been edited', async () => {
    const updateSendMessage = new MessagePrivateMockUpdate('not a card').build();
    const updateEditMessage = new MessagePrivateMockUpdate('').buildOverwrite({
      edited_message: { ...updateSendMessage.message, text: '4111 1111 1111 1111' },
    });

    await bot.handleUpdate(updateSendMessage);
    await bot.handleUpdate(updateEditMessage);

    const expectedMethods = outgoingRequests.buildMethods(['deleteMessage', 'getChat', 'sendMessage', 'sendMessage']);

    const actualMethods = outgoingRequests.getMethods();

    expect(expectedMethods).toEqual(actualMethods);
  });
});
