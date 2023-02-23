import { hydrateReply } from '@grammyjs/parse-mode';
import { Bot } from 'grammy';

import type { OutgoingRequests } from '../../../../testing';
import { MessagePrivateMockUpdate, prepareBotForTesting } from '../../../../testing';
import { mockChatSession } from '../../../../testing-main';
import type { GrammyContext } from '../../../../types';
import { logContextMiddleware, parseLocations, parseText, stateMiddleware } from '../../../middleware';
import { selfDestructedReply } from '../../../plugins';
import { getNoLocationsComposer } from '../no-locations.composer';

let outgoingRequests: OutgoingRequests;
const { noLocationsComposer } = getNoLocationsComposer();
const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({
  chatSettings: {
    enableDeleteLocations: false,
    disableDeleteMessage: false,
  },
});

describe('noLocationsComposer', () => {
  beforeAll(async () => {
    bot.use(hydrateReply);
    bot.use(selfDestructedReply());

    bot.use(stateMiddleware);
    bot.use(parseText);
    bot.use(parseLocations);
    bot.use(logContextMiddleware);
    bot.use(mockChatSessionMiddleware);

    bot.use(noLocationsComposer);

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, {
      getChat: {
        invite_link: '',
      },
    });
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteLocations = true;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should delete location in any case', async () => {
      const update = new MessagePrivateMockUpdate('Тут ТеРемкИ без сВітла').build();
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

    it('should delete location message and do not notify if disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;
      const update = new MessagePrivateMockUpdate('Тут ТеРемкИ без сВітла').build();
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

    it('should not delete message without a location', async () => {
      const update = new MessagePrivateMockUpdate(
        'Інтерактивна мапа дозволяє швидко і зручно дізнатися погоду в містах України. На ній відображаються погодні умови в найбільших містах України з можливістю перегляду прогнозу погоди на тиждень. Щоб дізнатися докладний прогноз погоди в вашому місті досить натиснути на назву населеного пункту на мапі.',
      ).build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteLocations = false;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should delete location in any case', async () => {
      const update = new MessagePrivateMockUpdate('Тут ТеРемкИ без сВітла').build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });

    it('should not delete message without a location', async () => {
      const update = new MessagePrivateMockUpdate(
        'Інтерактивна мапа дозволяє швидко і зручно дізнатися погоду в містах України. На ній відображаються погодні умови в найбільших містах України з можливістю перегляду прогнозу погоди на тиждень. Щоб дізнатися докладний прогноз погоди в вашому місті досить натиснути на назву населеного пункту на мапі.',
      ).build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });
  });
});
