import { Bot } from 'grammy';

import { getMessagesRegisterComposer } from '@bot/composers/messages.composer';
import { getNoCardsComposer } from '@bot/composers/messages/no-cards.composer';
import { parseCards } from '@bot/middleware/parse-cards.middleware';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import { mockChatSession } from '@testing/../testing-main';
import type { OutgoingRequests } from '@testing/outgoing-requests';
import { prepareBotForTesting } from '@testing/prepare';
import { MessagePrivateMockUpdate } from '@testing/updates/message-private-mock.update';

import type { GrammyContext } from '@app-types/context';

import { i18n } from '../src/i18n';

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

    bot.use(i18n);
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
      edited_message: { ...updateSendMessage.message, text: '4111 1111 1111 1111', edit_date: Date.now() },
    });

    await bot.handleUpdate(updateSendMessage);
    await bot.handleUpdate(updateEditMessage);

    const expectedMethods = outgoingRequests.buildMethods(['deleteMessage', 'getChat', 'sendMessage', 'sendMessage']);

    const actualMethods = outgoingRequests.getMethods();

    expect(expectedMethods).toEqual(actualMethods);
  });
});
