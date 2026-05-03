import type { Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { getNoCounterOffensiveComposer } from '@bot/composers/messages/no-counteroffensive.composer';
import { i18n } from '@bot/i18n';
import { parseIsCounteroffensive } from '@bot/middleware/parse-is-counteroffensive.middleware';
import { parseText } from '@bot/middleware/parse-text.middleware';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import { mockDynamicStorageService } from '@services/_mocks/index.mocks';
import { CounteroffensiveService } from '@services/counteroffensive.service';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession } from '@test-helpers/session-mocks';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;

const { noCounterOffensiveComposer } = getNoCounterOffensiveComposer();
const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({
  chatSettings: {
    enableDeleteCounteroffensive: true,
  },
});

const counteroffensiveService = new CounteroffensiveService(mockDynamicStorageService);

describe('noCounteroffensiveComposer', () => {
  beforeAll(async () => {
    bot.use(i18n);
    bot.use(selfDestructedReply());

    bot.use(stateMiddleware);
    bot.use(parseText);
    bot.use(parseIsCounteroffensive(counteroffensiveService));
    bot.use(mockChatSessionMiddleware);

    bot.use(noCounterOffensiveComposer);

    ({ chats } = await prepareBot<GrammyContext>(bot));

    user = chats.newUser();
    group = chats.newSupergroup();
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteCounteroffensive = true;
    });

    beforeEach(() => {
      chats.clear();
    });

    it('should delete if counteroffensive is used', async () => {
      await user.sendText('Сьогодні планується контрнаступ о 10:00', { chat: group });

      const [deleteMessageRequest, getChatRequest, sendLogsMessageRequest, sendMessageRequest] = chats.outgoing.getAll<
        'deleteMessage',
        'getChat',
        'sendMessage',
        'sendMessage'
      >();

      expect(chats.outgoing.length).toEqual(4);
      expect(deleteMessageRequest?.method).toEqual('deleteMessage');
      expect(getChatRequest?.method).toEqual('getChat');
      expect(sendLogsMessageRequest?.method).toEqual('sendMessage');
      expect(sendMessageRequest?.method).toEqual('sendMessage');
      expect(chats.deletionsFor(group).length).toEqual(1);
    });

    it('should delete if counteroffensive regex is used', async () => {
      await user.sendText('Сьогодні планується контр-наступ о 10:00', { chat: group });

      const [deleteMessageRequest, getChatRequest, sendLogsMessageRequest, sendMessageRequest] = chats.outgoing.getAll<
        'deleteMessage',
        'getChat',
        'sendMessage',
        'sendMessage'
      >();

      expect(chats.outgoing.length).toEqual(4);
      expect(deleteMessageRequest?.method).toEqual('deleteMessage');
      expect(getChatRequest?.method).toEqual('getChat');
      expect(sendLogsMessageRequest?.method).toEqual('sendMessage');
      expect(sendMessageRequest?.method).toEqual('sendMessage');
      expect(chats.deletionsFor(group).length).toEqual(1);
    });

    it('should delete if counteroffensive is used and do not notify if disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;
      await user.sendText('Сьогодні планується контрнаступ о 10:00', { chat: group });

      const [deleteMessageRequest, getChatRequest, sendLogsMessageRequest] = chats.outgoing.getAll<
        'deleteMessage',
        'getChat',
        'sendMessage'
      >();

      expect(chats.outgoing.length).toEqual(3);
      expect(deleteMessageRequest?.method).toEqual('deleteMessage');
      expect(getChatRequest?.method).toEqual('getChat');
      expect(sendLogsMessageRequest?.method).toEqual('sendMessage');
      expect(chats.deletionsFor(group).length).toEqual(1);
    });

    it('should not delete if not counteroffensive', async () => {
      await user.sendText(
        'Інтерактивна мапа дозволяє швидко і зручно дізнатися погоду в містах України. На ній відображаються погодні умови в найбільших містах України з можливістю перегляду прогнозу погоди на тиждень. Щоб дізнатися докладний прогноз погоди в вашому місті досить натиснути на назву населеного пункту на мапі.',
        { chat: group },
      );

      expect(chats.outgoing.length).toEqual(0);
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteCounteroffensive = false;
    });

    beforeEach(() => {
      chats.clear();
    });

    it('should not delete if counteroffensive is used', async () => {
      await user.sendText('Сьогодні планується контрнаступ о 10:00', { chat: group });

      expect(chats.outgoing.length).toEqual(0);
    });

    it('should not delete if not russian is used', async () => {
      await user.sendText(
        'Інтерактивна мапа дозволяє швидко і зручно дізнатися погоду в містах України. На ній відображаються погодні умови в найбільших містах України з можливістю перегляду прогнозу погоди на тиждень. Щоб дізнатися докладний прогноз погоди в вашому місті досить натиснути на назву населеного пункту на мапі.',
        { chat: group },
      );

      expect(chats.outgoing.length).toEqual(0);
    });
  });
});
