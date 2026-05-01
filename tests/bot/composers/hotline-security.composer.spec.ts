import type { Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { getBeforeAnyComposer } from '@bot/composers/before-any.composer';
import { getHotlineSecurityComposer } from '@bot/composers/hotline-security.composer';
import { i18n } from '@bot/i18n';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession } from '@test-helpers/session-mocks';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;

const bot = new Bot<GrammyContext>('mock');
const { hotlineSecurityComposer } = getHotlineSecurityComposer();
const { chatSession, mockChatSessionMiddleware } = mockChatSession({ isBotAdmin: true });

describe('hotlineSecurityComposer', () => {
  beforeAll(async () => {
    const { beforeAnyComposer } = getBeforeAnyComposer();

    bot.use(i18n);
    bot.use(selfDestructedReply());
    bot.use(stateMiddleware);
    bot.use(beforeAnyComposer);
    bot.use(mockChatSessionMiddleware);
    bot.use(hotlineSecurityComposer);

    ({ chats } = await prepareBot<GrammyContext>(bot));
    user = chats.newUser();
    group = chats.newSupergroup();
  }, 5000);

  beforeEach(() => {
    chats.outgoing.clear();
    user.replies.clear();
    chats.deletionsFor(group).clear();
    chatSession.isBotAdmin = true;
  });

  describe('/hotline_security command', () => {
    describe('positive cases', () => {
      it('should delete the command message and send help message', async () => {
        await user.sendCommand('/hotline_security', undefined, { chat: group });

        const methods = chats.outgoing.getMethods();

        expect(methods).toContain('deleteMessage');
        expect(methods).toContain('sendMessage');
      });

      it('should handle the command in private chat too', async () => {
        await user.sendCommand('/hotline_security');

        expect(chats.outgoing.getMethods()).toContain('sendMessage');
      });
    });
  });
});
