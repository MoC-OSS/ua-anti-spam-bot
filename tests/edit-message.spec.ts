import type { Chats, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { getMessagesRegisterComposer } from '@bot/composers/messages.composer';
import { getNoCardsComposer } from '@bot/composers/messages/no-cards.composer';
import { i18n } from '@bot/i18n';
import { parseCards } from '@bot/middleware/parse-cards.middleware';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession } from './helpers/session-mocks';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;

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

    ({ chats } = await prepareBot<GrammyContext>(bot));

    user = chats.newUser();
  }, 5000);

  beforeEach(() => {
    chats.clear();
  });

  it('should remove a card message', async () => {
    await user.sendText('4111 1111 1111 1111');

    const expectedMethods = chats.outgoing.buildMethods(['deleteMessage', 'getChat', 'sendMessage', 'sendMessage']);
    const actualMethods = chats.outgoing.getMethods();

    expect(expectedMethods).toEqual(actualMethods);
  });

  it('should not remove a card message', async () => {
    await user.sendText('not a card');

    const expectedMethods = chats.outgoing.buildMethods([]);
    const actualMethods = chats.outgoing.getMethods();

    expect(expectedMethods).toEqual(actualMethods);
  });

  it('should remove the message if it has been edited', async () => {
    const message = await user.sendText('not a card');

    await user.editMessage(message.message_id, '4111 1111 1111 1111');

    const expectedMethods = chats.outgoing.buildMethods(['deleteMessage', 'getChat', 'sendMessage', 'sendMessage']);
    const actualMethods = chats.outgoing.getMethods();

    expect(expectedMethods).toEqual(actualMethods);
  });
});
