import { hydrateReply } from '@grammyjs/parse-mode';
import { Bot } from 'grammy';

import { hasNoLinkedChats } from '../../../../message';
import { mockRedisService } from '../../../../services/_mocks/index.mocks';
import type { ApiResponses, OutgoingRequests } from '../../../../testing';
import { MessageMockUpdate, MessagePrivateMockUpdate, prepareBotForTesting } from '../../../../testing';
import { mockChatSession } from '../../../../testing-main';
import type { GrammyContext } from '../../../../types';
import { stateMiddleware } from '../../../middleware';
import { selfDestructedReply } from '../../../plugins';
import { SettingsCommand } from '../settings.command';

let outgoingRequests: OutgoingRequests;
const bot = new Bot<GrammyContext>('mock');
const settingsMiddleware = new SettingsCommand(mockRedisService);
const genericUpdate = new MessageMockUpdate('');

const { chatSession, mockChatSessionMiddleware } = mockChatSession({});

const chatAdmins = [genericUpdate.genericOwner, genericUpdate.genericAdmin];
const apiResponses: ApiResponses = {
  getChatMember: {
    status: 'creator',
  },
  getChatAdministrators: chatAdmins,
};

const getUserSessionSpy = jest.spyOn(mockRedisService, 'getUserSession');
const setUserSessionSpy = jest.spyOn(mockRedisService, 'setUserSession');

const commandMessage = '/settings';

function getSettingsCommandUpdate() {
  return new MessageMockUpdate(commandMessage).buildOverwrite({
    message: {
      entities: [
        {
          offset: 0,
          length: commandMessage.length,
          type: 'bot_command',
        },
      ],
    },
  });
}

function getPrivateSettingsCommandUpdate() {
  return new MessagePrivateMockUpdate(commandMessage).buildOverwrite({
    message: {
      entities: [
        {
          offset: 0,
          length: commandMessage.length,
          type: 'bot_command',
        },
      ],
    },
  });
}

describe('SettingsCommand', () => {
  beforeAll(async () => {
    bot.use(hydrateReply);
    bot.use(selfDestructedReply());

    bot.use(stateMiddleware);
    bot.use(mockChatSessionMiddleware);

    bot.command('settings', settingsMiddleware.middleware());

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, apiResponses);
  }, 5000);

  beforeEach(() => {
    outgoingRequests.clear();
    chatSession.isBotAdmin = true;
    setUserSessionSpy.mockClear();

    if (apiResponses.getChatMember) {
      apiResponses.getChatMember.status = 'creator';
    }
  });

  describe('private flow', () => {
    it('should send not available settings if there are no linked chats', async () => {
      getUserSessionSpy.mockReturnValueOnce(
        Promise.resolve({
          id: '',
          data: {
            isCurrentUserAdmin: false,
          },
          linkedChats: [],
        }),
      );

      await bot.handleUpdate(getPrivateSettingsCommandUpdate());

      const expectedMethods = outgoingRequests.buildMethods(['deleteMessage', 'sendMessage']);

      const actualMethods = outgoingRequests.getMethods();

      expect(expectedMethods).toEqual(actualMethods);
      expect(outgoingRequests.getAll<'deleteMessage', 'sendMessage'>()[1]?.payload.text).toEqual(hasNoLinkedChats);
    });

    it('should send link if there are linked chats', async () => {
      getUserSessionSpy.mockReturnValueOnce(
        Promise.resolve({
          id: '',
          data: {
            isCurrentUserAdmin: false,
          },
          linkedChats: [{ id: '', name: '' }],
        }),
      );

      await bot.handleUpdate(getPrivateSettingsCommandUpdate());

      const expectedMethods = outgoingRequests.buildMethods(['deleteMessage', 'sendMessage']);

      const actualMethods = outgoingRequests.getMethods();

      expect(expectedMethods).toEqual(actualMethods);
      expect(outgoingRequests.getAll<'deleteMessage', 'sendMessage'>()[1]?.payload.text).not.toEqual(hasNoLinkedChats);
    });
  });

  describe('group flow', () => {
    it('should not allow to call settings for a regular user', async () => {
      if (apiResponses.getChatMember) {
        apiResponses.getChatMember.status = 'member';
      }

      await bot.handleUpdate(getSettingsCommandUpdate());

      const expectedMethods = outgoingRequests.buildMethods(['getChatMember', 'deleteMessage', 'sendMessage']);

      const actualMethods = outgoingRequests.getMethods();

      expect(expectedMethods).toEqual(actualMethods);
    });

    it('should not allow to call settings for an admin if bot is not admin', async () => {
      chatSession.isBotAdmin = false;

      await bot.handleUpdate(getSettingsCommandUpdate());

      const expectedMethods = outgoingRequests.buildMethods(['getChatMember', 'deleteMessage', 'sendMessage']);

      const actualMethods = outgoingRequests.getMethods();

      expect(expectedMethods).toEqual(actualMethods);
    });

    it('should add all admins when a regular admin calls', async () => {
      await bot.handleUpdate(getSettingsCommandUpdate());

      const expectedMethods = outgoingRequests.buildMethods(['getChatMember', 'deleteMessage', 'getChatAdministrators', 'sendMessage']);

      const actualMethods = outgoingRequests.getMethods();

      expect(expectedMethods).toEqual(actualMethods);
      expect(setUserSessionSpy).toHaveBeenCalledTimes(chatAdmins.length);
      expect(setUserSessionSpy).toHaveBeenNthCalledWith(1, chatAdmins[0].user.id.toString(), {
        data: { isCurrentUserAdmin: false },
        id: chatAdmins[0].user.id.toString(),
        linkedChats: [{ id: genericUpdate.genericSuperGroup.id.toString(), name: genericUpdate.genericSuperGroup.title }],
      });

      expect(setUserSessionSpy).toHaveBeenNthCalledWith(2, chatAdmins[1].user.id.toString(), {
        data: { isCurrentUserAdmin: false },
        id: chatAdmins[1].user.id.toString(),
        linkedChats: [{ id: genericUpdate.genericSuperGroup.id.toString(), name: genericUpdate.genericSuperGroup.title }],
      });
    });
  });
});
