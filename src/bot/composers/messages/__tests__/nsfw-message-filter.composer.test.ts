import { hydrateReply } from '@grammyjs/parse-mode';
import { Bot } from 'grammy';

import { mockDynamicStorageService } from '../../../../services/_mocks/index.mocks';
import { NsfwDetectService } from '../../../../services/nsfw-detect.service';
import type { OutgoingRequests } from '../../../../testing';
import { MessageMockUpdate, prepareBotForTesting } from '../../../../testing';
import { mockChatSession } from '../../../../testing-main';
import type { GrammyContext } from '../../../../types';
import { parseText, stateMiddleware } from '../../../middleware';
import { selfDestructedReply } from '../../../plugins';
import { getNsfwMessageFilterComposer } from '../nsfw-message-filter.composer';

let outgoingRequests: OutgoingRequests;
const nsfwDetectService = new NsfwDetectService(mockDynamicStorageService, 0.6);
const { nsfwMessageFilterComposer } = getNsfwMessageFilterComposer({ nsfwDetectService });
const bot = new Bot<GrammyContext>('mock');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({
  chatSettings: {
    disableNsfwFilter: false,
    disableDeleteMessage: false,
  },
});

describe('nsfwMessageFilterComposer', () => {
  beforeAll(async () => {
    bot.use(hydrateReply);
    bot.use(selfDestructedReply());

    bot.use(stateMiddleware);
    bot.use(parseText);
    bot.use(mockChatSessionMiddleware);

    bot.use(nsfwMessageFilterComposer);

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, {
      getChat: {
        invite_link: '',
      },
    });
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.disableNsfwFilter = false;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should delete if nsfw message is used', async () => {
      const update = new MessageMockUpdate('Радую голой фоточкой всіх нових в каналі').build();
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

    it('should delete if nsfw message is used and do not notify if disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;
      const update = new MessageMockUpdate('Радую голой фоточкой всіх нових в каналі').build();
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

    it('should not delete if not nsfw message', async () => {
      const update = new MessageMockUpdate(`Я додам нові фотографії зими з новорічної події`).build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.disableNsfwFilter = true;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should not delete if nsfw message is used', async () => {
      const update = new MessageMockUpdate('Радую голой фоточкой всіх нових в каналі').build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });

    it('should not delete if not nsfw message is used', async () => {
      const update = new MessageMockUpdate(`Я додам нові фотографії зими з новорічної події`).build();
      await bot.handleUpdate(update);

      expect(outgoingRequests.length).toEqual(0);
    });
  });
});
