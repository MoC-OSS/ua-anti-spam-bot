import { hydrateReply } from '@grammyjs/parse-mode';
import { Bot } from 'grammy';

import { mockDynamicStorageService } from '../../../../services/_mocks/index.mocks';
import type { OutgoingRequests } from '../../../../testing';
import { MessageMockUpdate, prepareBotForTesting } from '../../../../testing';
import { mockChatSession } from '../../../../testing-main';
import type { GrammyContext } from '../../../../types';
import { parseIsRussian, parseText, stateMiddleware } from '../../../middleware';
import { selfDestructedReply } from '../../../plugins';
import { getNoRussianComposer } from '../no-russian.composer';

let outgoingRequests: OutgoingRequests;
const { noRussianComposer } = getNoRussianComposer({ dynamicStorageService: mockDynamicStorageService });
const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({
  chatSettings: {
    enableDeleteRussian: true,
    disableDeleteMessage: false,
  },
});

describe('noRussianComposer', () => {
  beforeAll(async () => {
    bot.use(hydrateReply);
    bot.use(selfDestructedReply());

    bot.use(stateMiddleware);
    bot.use(parseText);
    bot.use(parseIsRussian);
    bot.use(mockChatSessionMiddleware);

    bot.use(noRussianComposer);

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, {
      getChat: {
        invite_link: '',
      },
    });
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteRussian = true;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should delete if russian is used', async () => {
      const update = new MessageMockUpdate('съешь еще этих французских булок').build();
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

    it('should delete if russian is used and do not notify if disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;
      const update = new MessageMockUpdate('съешь еще этих французских булок').build();
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

    it('should not delete if not russian', async () => {
      const update = new MessageMockUpdate(
        'Інтерактивна мапа дозволяє швидко і зручно дізнатися погоду в містах України. На ній відображаються погодні умови в найбільших містах України з можливістю перегляду прогнозу погоди на тиждень. Щоб дізнатися докладний прогноз погоди в вашому місті досить натиснути на назву населеного пункту на мапі.',
      ).build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableDeleteRussian = false;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should not delete if russian is used', async () => {
      const update = new MessageMockUpdate('съешь еще этих французских булок').build();
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
