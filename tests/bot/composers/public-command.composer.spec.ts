import { Bot } from 'grammy';
import type { Chats, Supergroup, User } from 'grammy-testing';
import { prepareBot } from 'grammy-testing';

import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { getPublicCommandsComposer } from '@bot/composers/public-command.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession, mockSession } from '@test-helpers/session-mocks';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;

const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({});

const { session, mockSessionMiddleware } = mockSession({
  isCurrentUserAdmin: false,
});

describe('PublicCommandsComposer', () => {
  beforeAll(async () => {
    const { beforeAnyComposer } = getBeforeAnyComposer();
    const { publicCommandsComposer } = getPublicCommandsComposer({ startTime: new Date('2026-03-18T00:00:00.000Z') });

    bot.use(i18n);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(mockSessionMiddleware);
    bot.use(beforeAnyComposer);
    bot.use(mockChatSessionMiddleware);
    bot.use(publicCommandsComposer);

    ({ chats } = await prepareBot<GrammyContext>(bot));

    user = chats.newUser();
    group = chats.newSupergroup();
    group.own(user);
  }, 5000);

  beforeEach(() => {
    chats.clear();
    chatSession.isBotAdmin = true;
    chatSession.language = undefined;
    delete session.roleMode;
    session.isCurrentUserAdmin = false;
  });

  describe('handled commands', () => {
    it('should delete the incoming /language command before replying', async () => {
      await user.sendCommand('/language', undefined, { chat: group });

      expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember', 'deleteMessage', 'sendMessage']));
    });

    it('should delete the incoming /status command before replying', async () => {
      await user.sendCommand('/status', undefined, { chat: group });

      expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember', 'deleteMessage', 'sendMessage']));
    });

    it('should delete the incoming /role command before replying', async () => {
      await user.sendCommand('/role', undefined, { chat: group });

      expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember', 'deleteMessage', 'sendMessage']));
    });
  });

  describe('non-command messages', () => {
    it('should not delete plain user messages that are not handled by the public commands composer', async () => {
      await user.sendText('hello', { chat: group });

      expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember']));
    });
  });
});
