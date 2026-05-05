import type { Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { getNsfwMessageFilterComposer } from '@bot/composers/messages/nsfw-message-filter.composer';
import { i18n } from '@bot/i18n';
import { parseText } from '@bot/middleware/parse-text.middleware';
import { stateMiddleware } from '@bot/middleware/state.middleware';
import { selfDestructedReply } from '@bot/plugins/self-destructed.plugin';

import { mockDynamicStorageService } from '@services/_mocks/index.mocks';
import { NsfwDetectService } from '@services/nsfw-detect.service';

import type { GrammyContext } from '@app-types/context';

import { mockChatSession } from '@test-helpers/session-mocks';

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;

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
    bot.use(i18n);
    bot.use(selfDestructedReply());

    bot.use(stateMiddleware);
    bot.use(parseText);
    bot.use(mockChatSessionMiddleware);

    bot.use(nsfwMessageFilterComposer);

    ({ chats } = await prepareBot<GrammyContext>(bot));

    user = chats.newUser();
    group = chats.newSupergroup();
  }, 5000);

  describe('enabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.disableNsfwFilter = false;
    });

    beforeEach(() => {
      chats.clear();
    });

    it('should delete if nsfw message is used', async () => {
      await user.sendText('Радую голой фоточкой всіх нових в каналі', { chat: group });

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

    it('should delete if nsfw message is used and do not notify if disableDeleteMessage is true', async () => {
      chatSession.chatSettings.disableDeleteMessage = true;
      await user.sendText('Радую голой фоточкой всіх нових в каналі', { chat: group });

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

    it('should not delete if not nsfw message', async () => {
      await user.sendText('Я додам нові фотографії зими з новорічної події', { chat: group });

      expect(chats.outgoing.length).toEqual(0);
    });
  });

  describe('disabled feature', () => {
    beforeAll(() => {
      chatSession.chatSettings.disableNsfwFilter = true;
    });

    beforeEach(() => {
      chats.clear();
    });

    it('should not delete if nsfw message is used', async () => {
      await user.sendText('Радую голой фоточкой всіх нових в каналі', { chat: group });

      expect(chats.outgoing.length).toEqual(0);
    });

    it('should not delete if not nsfw message is used', async () => {
      await user.sendText('Я додам нові фотографії зими з новорічної події', { chat: group });

      expect(chats.outgoing.length).toEqual(0);
    });
  });
});
