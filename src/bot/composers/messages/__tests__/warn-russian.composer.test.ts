import { hydrateReply } from '@grammyjs/parse-mode';
import { Bot } from 'grammy';

import { mockDynamicStorageService } from '../../../../services/_mocks/index.mocks';
import type { OutgoingRequests } from '../../../../testing';
import { MessageSuperGroupMockUpdate, prepareBotForTesting } from '../../../../testing';
import { mockChatSession } from '../../../../testing-main';
import type { GrammyContext } from '../../../../types';
import { parseIsRussian, parseText, stateMiddleware } from '../../../middleware';
import { selfDestructedReply } from '../../../plugins';
import { getWarnRussianComposer } from '../warn-russian.composer';

let outgoingRequests: OutgoingRequests;
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
    bot.use(hydrateReply);
    bot.use(selfDestructedReply());

    bot.use(stateMiddleware);
    bot.use(parseText);
    bot.use(parseIsRussian);
    bot.use(mockChatSessionMiddleware);

    bot.use(warnRussianComposer);

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot);
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableWarnRussian = true;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should warn if russian is used', async () => {
      const update = new MessageSuperGroupMockUpdate('съешь еще этих французских булок').build();
      await bot.handleUpdate(update);

      const [sendMessageRequest] = outgoingRequests.getAll<'sendMessage'>();

      expect(outgoingRequests.length).toEqual(1);
      expect(sendMessageRequest?.method).toEqual('sendMessage');
    });

    it('should warn if russian is used and do still notify if disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;
      const update = new MessageSuperGroupMockUpdate('съешь еще этих французских булок').build();
      await bot.handleUpdate(update);

      const [sendMessageRequest] = outgoingRequests.getAll<'sendMessage'>();

      expect(outgoingRequests.length).toEqual(1);
      expect(sendMessageRequest?.method).toEqual('sendMessage');
    });

    it('should not warn if not russian', async () => {
      const update = new MessageSuperGroupMockUpdate(
        'Інтерактивна мапа дозволяє швидко і зручно дізнатися погоду в містах України. На ній відображаються погодні умови в найбільших містах України з можливістю перегляду прогнозу погоди на тиждень. Щоб дізнатися докладний прогноз погоди в вашому місті досить натиснути на назву населеного пункту на мапі.',
      ).build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.enableWarnRussian = false;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should not warn if russian is used', async () => {
      const update = new MessageSuperGroupMockUpdate('съешь еще этих французских булок').build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });

    it('should not warn if not russian is used', async () => {
      const update = new MessageSuperGroupMockUpdate(
        'Інтерактивна мапа дозволяє швидко і зручно дізнатися погоду в містах України. На ній відображаються погодні умови в найбільших містах України з можливістю перегляду прогнозу погоди на тиждень. Щоб дізнатися докладний прогноз погоди в вашому місті досить натиснути на назву населеного пункту на мапі.',
      ).build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });
  });
});
