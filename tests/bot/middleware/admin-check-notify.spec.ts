import type { Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { getNoCardsComposer } from '@bot/composers/messages/no-cards.composer';
import { i18n } from '@bot/i18n';
import { adminCheckNotify } from '@bot/middleware/admin-check-notify.middleware';
import { onlyNotAdmin } from '@bot/middleware/only-not-admin.middleware';
import { parseCards } from '@bot/middleware/parse-cards.middleware';
import { parseText } from '@bot/middleware/parse-text.middleware';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession, mockState } from '@test-helpers/session-mocks';

// eslint-disable-next-line vitest/no-mocks-import
import { realSwindlerMessage } from '../../__mocks__/bot.mocks';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;

const { beforeAnyComposer } = getBeforeAnyComposer();
const { noCardsComposer } = getNoCardsComposer();
const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({
  chatSettings: {
    enableDeleteCards: true,
  },
});

const { state, mockStateMiddleware } = mockState({});

describe('admin-check-notify', () => {
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

    ({ chats } = await prepareBot<GrammyContext>(bot, {
      responses: {
        getChatMember: { status: 'creator' },
        getChat: { invite_link: '' },
      },
    }));

    user = chats.newUser();
    group = chats.newSupergroup();
  }, 5000);

  beforeEach(() => {
    chats.outgoing.clear();
    user.replies.clear();
    chats.deletionsFor(group).clear();
  });

  it('should remove a card message for admin if admin check enabled', async () => {
    chatSession.chatSettings.enableAdminCheck = true;
    await user.sendText('4111 1111 1111 1111', { chat: group });

    const expectedMethods = chats.outgoing.buildMethods(['getChatMember', 'deleteMessage', 'getChat', 'sendMessage', 'sendMessage']);
    const actualMethods = chats.outgoing.getMethods();

    expect(expectedMethods).toEqual(actualMethods);
    expect(chats.outgoing.length).toEqual(5);
  });

  it('should not remove a card message for admin if admin check disabled', async () => {
    chatSession.chatSettings.enableAdminCheck = false;
    await user.sendText('4111 1111 1111 1111', { chat: group });

    const expectedMethods = chats.outgoing.buildMethods(['getChatMember']);
    const actualMethods = chats.outgoing.getMethods();

    expect(expectedMethods).toEqual(actualMethods);
    expect(chats.outgoing.length).toEqual(1);
  });

  it('should notify admin in case if admin swindler message deleted', async () => {
    chatSession.isCheckAdminNotified = false;
    state.isDeleted = true;
    await user.sendText(realSwindlerMessage, { chat: group });

    const expectedMethods = chats.outgoing.buildMethods(['getChatMember', 'sendMessage']);
    const actualMethods = chats.outgoing.getMethods();

    expect(actualMethods).toEqual(expectedMethods);
    expect(chats.outgoing.length).toEqual(2);
  });
});
