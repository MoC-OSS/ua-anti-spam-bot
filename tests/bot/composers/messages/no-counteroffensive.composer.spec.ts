import { Bot } from 'grammy';

import { getNoCounterOffensiveComposer } from '@bot/composers/messages/no-counteroffensive.composer';
import { parseIsCounteroffensive } from '@bot/middleware/parse-is-counteroffensive.middleware';
import { parseText } from '@bot/middleware/parse-text.middleware';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import { mockDynamicStorageService } from '@services/_mocks/index.mocks';
import { CounteroffensiveService } from '@services/counteroffensive.service';

import { mockChatSession } from '@testing/../testing-main';
import type { OutgoingRequests } from '@testing/outgoing-requests';
import { prepareBotForTesting } from '@testing/prepare';
import { MessageMockUpdate } from '@testing/updates/message-super-group-mock.update';

import type { GrammyContext } from '@app-types/context';

import { i18n } from '../../../../src/i18n';

let outgoingRequests: OutgoingRequests;
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

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, {
      getChat: {
        invite_link: '',
      },
    });
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteCounteroffensive = true;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should delete if counteroffensive is used', async () => {
      const update = new MessageMockUpdate('Сьогодні планується контрнаступ о 10:00').build();

      await bot.handleUpdate(update);

      const [deleteMessageRequest, getChatRequest, sendLogsMessageRequest, sendMessageRequest] = outgoingRequests.getAll<
        'deleteMessage',
        'getChat',
        'sendMessage',
        'sendMessage'
      >();

      expect(outgoingRequests.length).toEqual(4);
      expect(deleteMessageRequest?.method).toEqual('deleteMessage');
      expect(getChatRequest?.method).toEqual('getChat');
      expect(sendLogsMessageRequest?.method).toEqual('sendMessage');
      expect(sendMessageRequest?.method).toEqual('sendMessage');
    });

    it('should delete if counteroffensive regex is used', async () => {
      const update = new MessageMockUpdate('Сьогодні планується контр-наступ о 10:00').build();

      await bot.handleUpdate(update);

      const [deleteMessageRequest, getChatRequest, sendLogsMessageRequest, sendMessageRequest] = outgoingRequests.getAll<
        'deleteMessage',
        'getChat',
        'sendMessage',
        'sendMessage'
      >();

      expect(outgoingRequests.length).toEqual(4);
      expect(deleteMessageRequest?.method).toEqual('deleteMessage');
      expect(getChatRequest?.method).toEqual('getChat');
      expect(sendLogsMessageRequest?.method).toEqual('sendMessage');
      expect(sendMessageRequest?.method).toEqual('sendMessage');
    });

    it('should delete if counteroffensive is used and do not notify if disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;
      const update = new MessageMockUpdate('Сьогодні планується контрнаступ о 10:00').build();

      await bot.handleUpdate(update);

      const [deleteMessageRequest, getChatRequest, sendLogsMessageRequest] = outgoingRequests.getAll<
        'deleteMessage',
        'getChat',
        'sendMessage'
      >();

      expect(outgoingRequests.length).toEqual(3);
      expect(deleteMessageRequest?.method).toEqual('deleteMessage');
      expect(getChatRequest?.method).toEqual('getChat');
      expect(sendLogsMessageRequest?.method).toEqual('sendMessage');
    });

    it('should not delete if not counteroffensive', async () => {
      const update = new MessageMockUpdate(
        'Інтерактивна мапа дозволяє швидко і зручно дізнатися погоду в містах України. На ній відображаються погодні умови в найбільших містах України з можливістю перегляду прогнозу погоди на тиждень. Щоб дізнатися докладний прогноз погоди в вашому місті досить натиснути на назву населеного пункту на мапі.',
      ).build();

      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteCounteroffensive = false;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should not delete if counteroffensive is used', async () => {
      const update = new MessageMockUpdate('Сьогодні планується контрнаступ о 10:00').build();

      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });

    it('should not delete if not russian is used', async () => {
      const update = new MessageMockUpdate(
        'Інтерактивна мапа дозволяє швидко і зручно дізнатися погоду в містах України. На ній відображаються погодні умови в найбільших містах України з можливістю перегляду прогнозу погоди на тиждень. Щоб дізнатися докладний прогноз погоди в вашому місті досить натиснути на назву населеного пункту на мапі.',
      ).build();

      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });
  });
});
