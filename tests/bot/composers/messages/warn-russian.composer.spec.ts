import type { Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { getWarnRussianComposer } from '@bot/composers/messages/warn-russian.composer';
import { parseIsRussian } from '@bot/middleware/parse-is-russian.middleware';
import { parseText } from '@bot/middleware/parse-text.middleware';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import { mockDynamicStorageService } from '@services/_mocks/index.mocks';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession } from '@test-helpers/session-mocks';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;

const { warnRussianComposer } = getWarnRussianComposer({ dynamicStorageService: mockDynamicStorageService });
const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({
  chatSettings: {
    enableWarnRussian: true,
    disableDeleteMessage: false,
  },
});

describe('warnRussianComposer', () => {
  beforeAll(async () => {
    bot.use(selfDestructedReply());

    bot.use(stateMiddleware);
    bot.use(parseText);
    bot.use(parseIsRussian);
    bot.use(mockChatSessionMiddleware);

    bot.use(warnRussianComposer);

    ({ chats } = await prepareBot<GrammyContext>(bot));

    user = chats.newUser();
    group = chats.newSupergroup();
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableWarnRussian = true;
    });

    beforeEach(() => {
      chats.outgoing.clear();
      user.replies.clear();
    });

    it('should warn if russian is used', async () => {
      await user.sendText('съешь еще этих французских булок', { chat: group });

      const [getChatRequest, sendLogsMessageRequest, sendMessageRequest] = chats.outgoing.getAll<'getChat', 'sendMessage', 'sendMessage'>();

      expect(chats.outgoing.length).toEqual(3);
      expect(getChatRequest?.method).toEqual('getChat');
      expect(sendLogsMessageRequest?.method).toEqual('sendMessage');
      expect(sendMessageRequest?.method).toEqual('sendMessage');
    });

    it('should warn if russian is used and do still notify if disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;
      await user.sendText('съешь еще этих французских булок', { chat: group });

      const [getChatRequest, sendLogsMessageRequest, sendMessageRequest] = chats.outgoing.getAll<'getChat', 'sendMessage', 'sendMessage'>();

      expect(chats.outgoing.length).toEqual(3);
      expect(getChatRequest?.method).toEqual('getChat');
      expect(sendLogsMessageRequest?.method).toEqual('sendMessage');
      expect(sendMessageRequest?.method).toEqual('sendMessage');
    });

    it('should not warn if not russian', async () => {
      await user.sendText(
        'Інтерактивна мапа дозволяє швидко і зручно дізнатися погоду в містах України. На ній відображаються погодні умови в найбільших містах України з можливістю перегляду прогнозу погоди на тиждень. Щоб дізнатися докладний прогноз погоди в вашому місті досить натиснути на назву населеного пункту на мапі.',
        { chat: group },
      );

      expect(chats.outgoing.length).toEqual(0);
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableWarnRussian = false;
    });

    beforeEach(() => {
      chats.outgoing.clear();
      user.replies.clear();
    });

    it('should not warn if russian is used', async () => {
      await user.sendText('съешь еще этих французских булок', { chat: group });

      expect(chats.outgoing.length).toEqual(0);
    });

    it('should not warn if not russian is used', async () => {
      await user.sendText(
        'Інтерактивна мапа дозволяє швидко і зручно дізнатися погоду в містах України. На ній відображаються погодні умови в найбільших містах України з можливістю перегляду прогнозу погоди на тиждень. Щоб дізнатися докладний прогноз погоди в вашому місті досить натиснути на назву населеного пункту на мапі.',
        { chat: group },
      );

      expect(chats.outgoing.length).toEqual(0);
    });
  });
});
