import type { Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { HelpCommand } from '@bot/commands/public/help.command';
import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession } from '@test-helpers/session-mocks';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;

const bot = new Bot<GrammyContext>('mock');
const helpMiddleware = new HelpCommand(new Date());

const { chatSession, mockChatSessionMiddleware } = mockChatSession({});

describe('HelpCommand', () => {
  beforeAll(async () => {
    const { beforeAnyComposer } = getBeforeAnyComposer();

    bot.use(i18n);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(beforeAnyComposer);
    bot.use(mockChatSessionMiddleware);

    bot.command('help', helpMiddleware.middleware());

    ({ chats } = await prepareBot<GrammyContext>(bot));

    user = chats.newUser();
    group = chats.newSupergroup();
    group.own(user);
  }, 5000);

  beforeEach(() => {
    chats.clear();
    chatSession.isBotAdmin = true;
  });

  describe('group flow', () => {
    describe('bot is admin', () => {
      it('should reply with help message', async () => {
        await user.sendCommand('/help', undefined, { chat: group });

        expect(chats.outgoing.getMethods()).toContain('getChatMember');
        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });
    });

    describe('bot is not admin', () => {
      beforeEach(() => {
        chatSession.isBotAdmin = false;
      });

      it('should reply with help message when bot is not admin', async () => {
        await user.sendCommand('/help', undefined, { chat: group });

        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });
    });
  });
});
