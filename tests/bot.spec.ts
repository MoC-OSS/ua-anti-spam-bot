import { Bot } from 'grammy';

import { getBot } from '@bot';
import { logsChat, secondLogsChat } from '@bot/creator';

import { environmentConfig } from '@shared/config';

import type { OutgoingRequests } from '@testing/outgoing-requests';
import { prepareBotForTesting } from '@testing/prepare';
import { mockChatSession, mockSession } from '@testing/testing-main';
import { LeftMemberMockUpdate } from '@testing/updates/left-member-mock.update';
import { MessagePrivateMockUpdate } from '@testing/updates/message-private-mock.update';
import { MessageMockUpdate } from '@testing/updates/message-super-group-mock.update';
import { NewMemberMockUpdate } from '@testing/updates/new-member-mock.update';

import type { GrammyContext } from '@app-types/context';

// eslint-disable-next-line vitest/no-mocks-import
import { realSwindlerMessage } from './__mocks__/bot.mocks';

/**
 * Enable unit testing
 */
Object.assign(environmentConfig, { UNIT_TESTING: true, DISABLE_LOGS_CHAT: false, DEBUG: false });

let outgoingRequests: OutgoingRequests;
let bot: Bot<GrammyContext>;

const { session, mockSessionMiddleware } = mockSession({});

const { chatSession, mockChatSessionMiddleware } = mockChatSession({
  isBotAdmin: true,
  botRemoved: false,
});

/**
 * Base chat settings that disable all default-enabled features (swindler, antisemitism, NSFW, strategic)
 * to isolate individual feature tests from interference.
 */
const baseIsolatedSettings = {
  disableSwindlerMessage: true,
  disableDeleteAntisemitism: true,
  disableNsfwFilter: true,
  disableStrategicInfo: true,
};

/**
 * Builds a private command update.
 * @param text - Command text.
 * @returns Telegram private message update with command entity.
 */
function getPrivateCommandUpdate(text: string) {
  const command = text.split(' ')[0] ?? text;

  return new MessagePrivateMockUpdate(text).buildOverwrite({
    message: {
      entities: [{ offset: 0, length: command.length, type: 'bot_command' }],
    },
  });
}

/**
 * Builds a group command update.
 * @param text - Command text.
 * @returns Telegram group message update with command entity.
 */
function getGroupCommandUpdate(text: string) {
  const command = text.split(' ')[0] ?? text;

  return new MessageMockUpdate(text).buildOverwrite({
    message: {
      entities: [{ offset: 0, length: command.length, type: 'bot_command' }],
    },
  });
}

describe('e2e bot testing', () => {
  beforeAll(async () => {
    const initialBot = new Bot<GrammyContext>(environmentConfig?.BOT_TOKEN || 'test');

    // Add mock session data
    initialBot.use(mockSessionMiddleware);
    initialBot.use(mockChatSessionMiddleware);

    bot = await getBot(initialBot);

    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, {
      getChat: {},
    });
  }, 15_000);

  describe('private flow', () => {
    describe('public commands', () => {
      beforeEach(() => {
        outgoingRequests.clear();
        chatSession.language = undefined;
        delete session.roleMode;
      });

      it('should handle /language in private chat', async () => {
        await bot.handleUpdate(getPrivateCommandUpdate('/language'));

        expect(chatSession.language).toBe('en');
        expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['deleteMessage', 'sendMessage']));
      });

      it('should handle /role in private chat', async () => {
        await bot.handleUpdate(getPrivateCommandUpdate('/role'));

        expect(session.roleMode).toBeUndefined();
        expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['deleteMessage', 'sendMessage']));
      });
    });

    describe('check regular message', () => {
      beforeEach(() => {
        outgoingRequests.clear();
      });

      it('should not remove a regular message and have 0 api calls', async () => {
        const update = new MessagePrivateMockUpdate('regular message').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.requests).toHaveLength(0);
      });

      it('should remove a swindler message and notify for first swindler in several hours', async () => {
        const update = new MessagePrivateMockUpdate(realSwindlerMessage).build();

        await bot.handleUpdate(update);

        const expectedMethods = outgoingRequests.buildMethods(['getChat', 'sendMessage', 'sendMessage', 'sendMessage', 'deleteMessage']);

        const [, sendLogsMessageRequest, sendSecondLogsMessageRequest] = outgoingRequests.getAll<
          'getChat',
          'sendMessage',
          'sendMessage',
          'sendMessage',
          'deleteMessage'
        >();

        const actualMethods = outgoingRequests.getMethods();

        expect(expectedMethods).toEqual(actualMethods);
        expect(sendLogsMessageRequest?.payload.chat_id).toEqual(logsChat);
        expect(sendSecondLogsMessageRequest?.payload.chat_id).toEqual(secondLogsChat);
        expect(outgoingRequests.requests).toHaveLength(5);
      });

      it('should remove a swindler message and dont notify after already notified', async () => {
        const update = new MessagePrivateMockUpdate(realSwindlerMessage).build();

        await bot.handleUpdate(update);

        const expectedMethods = outgoingRequests.buildMethods(['getChat', 'sendMessage', 'sendMessage', 'deleteMessage']);

        const [, sendLogsMessageRequest, sendSecondLogsMessageRequest] = outgoingRequests.getAll<
          'getChat',
          'sendMessage',
          'sendMessage',
          'deleteMessage'
        >();

        const actualMethods = outgoingRequests.getMethods();

        expect(expectedMethods).toEqual(actualMethods);
        expect(sendLogsMessageRequest?.payload.chat_id).toEqual(logsChat);
        expect(sendSecondLogsMessageRequest?.payload.chat_id).toEqual(secondLogsChat);
        expect(outgoingRequests.requests).toHaveLength(4);
      });
    });
  });

  describe('group or super group flow', () => {
    describe('public commands', () => {
      beforeEach(() => {
        outgoingRequests.clear();
        chatSession.language = undefined;
        chatSession.isBotAdmin = true;
        delete session.roleMode;
      });

      it('should reject /language in a group for a non-admin user', async () => {
        await bot.handleUpdate(getGroupCommandUpdate('/language'));

        expect(chatSession.language).toBeUndefined();
        expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember', 'deleteMessage', 'sendMessage']));
      });

      it('should reject /role in a group for a non-admin user', async () => {
        await bot.handleUpdate(getGroupCommandUpdate('/role'));

        expect(session.roleMode).toBeUndefined();
        expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember', 'deleteMessage', 'sendMessage']));
      });
    });

    describe('check regular message', () => {
      beforeEach(() => {
        outgoingRequests.clear();
      });

      it('should check is bot admin if isAdmin is empty', async () => {
        chatSession.isBotAdmin = undefined;
        const update = new MessageMockUpdate('regular message').build();

        await bot.handleUpdate(update);
        const [getChatAdminsRequest, getChatMemberRequest] = outgoingRequests.getTwoLast<'getChatAdministrators', 'getChatMember'>();

        expect(getChatAdminsRequest?.method).toEqual('getChatAdministrators');
        expect(getChatMemberRequest?.method).toEqual('getChatMember');
        expect(outgoingRequests.length).toEqual(2);
      });

      // eslint-disable-next-line vitest/max-nested-describe
      describe('bot is admin', () => {
        beforeAll(() => {
          chatSession.isBotAdmin = true;
        });

        beforeEach(() => {
          delete chatSession.lastWarningDate;
        });

        it('should check current user if its an admin to skip them', async () => {
          const update = new MessageMockUpdate('regular message').build();

          await bot.handleUpdate(update);

          const getChatMemberRequest = outgoingRequests.getFirst<'getChatMember'>();

          expect(getChatMemberRequest?.method).toEqual('getChatMember');
          expect(getChatMemberRequest?.payload.user_id).toEqual(update.message.from.id);
        });

        it('should request chat info if no is removed info', async () => {
          // eslint-disable-next-line sonarjs/different-types-comparison
          if (chatSession.botRemoved !== undefined) {
            // @ts-ignore
            delete chatSession.botRemoved;
          }

          const update = new MessageMockUpdate('regular message').build();

          await bot.handleUpdate(update);

          const [getChatRequest, getChatMemberRequest] = outgoingRequests.getTwoLast<'getChat', 'getChatMember'>();

          expect(outgoingRequests.requests).toHaveLength(2);
          expect(getChatRequest?.method).toEqual('getChat');
          expect(getChatMemberRequest?.method).toEqual('getChatMember');
        });

        it('should not remove a super group message', async () => {
          const update = new MessageMockUpdate('regular message').build();

          await bot.handleUpdate(update);

          expect(outgoingRequests.requests).toHaveLength(1);
        });

        it('should remove a swindler message and notify for first swindler in several hours', async () => {
          chatSession.lastWarningDate = new Date(0);
          const update = new MessageMockUpdate(realSwindlerMessage).build();

          await bot.handleUpdate(update);

          const expectedMethods = outgoingRequests.buildMethods([
            'getChatMember',
            'getChat',
            'sendMessage',
            'sendMessage',
            'sendMessage',
            'deleteMessage',
          ]);

          const requests = outgoingRequests.getAll<
            'getChatMember',
            'getChat',
            'sendMessage',
            'sendMessage',
            'sendMessage',
            'deleteMessage'
          >();

          const sendLogsMessageRequest = requests[2];
          const sendSecondLogsMessageRequest = requests[3];

          const actualMethods = outgoingRequests.getMethods();

          expect(expectedMethods).toEqual(actualMethods);
          expect(sendLogsMessageRequest?.payload.chat_id).toEqual(logsChat);
          expect(sendSecondLogsMessageRequest?.payload.chat_id).toEqual(secondLogsChat);
        });

        it('should remove a swindler message and dont notify after already notified', async () => {
          chatSession.lastWarningDate = new Date();
          const update = new MessageMockUpdate(realSwindlerMessage).build();

          await bot.handleUpdate(update);

          const expectedMethods = outgoingRequests.buildMethods([
            'getChatMember',
            'getChat',
            'sendMessage',
            'sendMessage',
            'deleteMessage',
          ]);

          const requests = outgoingRequests.getAll<'getChatMember', 'getChat', 'sendMessage', 'sendMessage', 'deleteMessage'>();
          const sendLogsMessageRequest = requests[2];
          const sendSecondLogsMessageRequest = requests[3];

          const actualMethods = outgoingRequests.getMethods();

          expect(expectedMethods).toEqual(actualMethods);
          expect(sendLogsMessageRequest?.payload.chat_id).toEqual(logsChat);
          expect(sendSecondLogsMessageRequest?.payload.chat_id).toEqual(secondLogsChat);
        });

        it('should delete swindler message if they are send in media group', async () => {
          const updateCaption = new MessageMockUpdate('').buildOverwrite({
            message: { media_group_id: '1', photo: [], caption: realSwindlerMessage },
          });

          const updatePhoto2 = new MessageMockUpdate('').buildOverwrite({
            message: { media_group_id: '1', photo: [] },
          });

          const updatePhoto3 = new MessageMockUpdate('').buildOverwrite({
            message: { media_group_id: '1', photo: [] },
          });

          await bot.handleUpdate(updateCaption);
          await bot.handleUpdate(updatePhoto2);
          await bot.handleUpdate(updatePhoto3);

          const expectedMethods = outgoingRequests.buildMethods([
            'getChatMember',
            'getChat',
            'sendMessage',
            'sendMessage',
            'sendMessage',
            'deleteMessage',
            'getChatMember',
            'deleteMessage',
            'getChatMember',
            'deleteMessage',
          ]);

          const actualMethods = outgoingRequests.getMethods();

          expect(actualMethods.filter((method) => method === 'deleteMessage')).toHaveLength(3);
          expect(expectedMethods).toEqual(actualMethods);
        });

        it('should delete swindler message if they are send in media group but dont delete another group', async () => {
          const updateCaption = new MessageMockUpdate('').buildOverwrite({
            message: { media_group_id: '1', photo: [], caption: realSwindlerMessage },
          });

          const updatePhoto2 = new MessageMockUpdate('').buildOverwrite({
            message: { media_group_id: '1', photo: [] },
          });

          const updateCaption2 = new MessageMockUpdate('').buildOverwrite({
            message: { media_group_id: '2', photo: [], caption: 'just a regular message' },
          });

          const updatePhoto22 = new MessageMockUpdate('').buildOverwrite({
            message: { media_group_id: '2', photo: [] },
          });

          await bot.handleUpdate(updateCaption);
          await bot.handleUpdate(updatePhoto2);
          await bot.handleUpdate(updateCaption2);
          await bot.handleUpdate(updatePhoto22);

          const actualMethods = outgoingRequests.getMethods();

          expect(actualMethods.filter((method) => method === 'deleteMessage')).toHaveLength(2);
        });
      });
    });
  });

  describe('feature filters in group', () => {
    beforeAll(() => {
      chatSession.isBotAdmin = true;
      chatSession.botRemoved = false;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    describe('no-russian feature', () => {
      beforeAll(() => {
        chatSession.chatSettings = { ...baseIsolatedSettings, enableDeleteRussian: true } as unknown as typeof chatSession.chatSettings;
      });

      it('should delete a russian language message', async () => {
        const update = new MessageMockUpdate('съешь еще этих французских булок').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(
          outgoingRequests.buildMethods(['getChatMember', 'deleteMessage', 'getChat', 'sendMessage', 'sendMessage']),
        );
      });

      it('should not delete a ukrainian language message', async () => {
        const update = new MessageMockUpdate('Привіт, як справи сьогодні?').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember']));
      });
    });

    describe('warn-russian feature', () => {
      beforeAll(() => {
        chatSession.chatSettings = { ...baseIsolatedSettings, enableWarnRussian: true } as unknown as typeof chatSession.chatSettings;
      });

      it('should warn without deleting a russian language message', async () => {
        const update = new MessageMockUpdate('съешь еще этих французских булок').build();

        await bot.handleUpdate(update);

        const methods = outgoingRequests.getMethods();

        expect(methods).toEqual(outgoingRequests.buildMethods(['getChatMember', 'getChat', 'sendMessage', 'sendMessage']));
        expect(methods).not.toContain('deleteMessage');
      });

      it('should not warn for a ukrainian language message', async () => {
        const update = new MessageMockUpdate('Привіт, як справи сьогодні?').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember']));
      });
    });

    describe('no-obscene feature', () => {
      beforeAll(() => {
        chatSession.chatSettings = { ...baseIsolatedSettings, enableDeleteObscene: true } as unknown as typeof chatSession.chatSettings;
      });

      it('should delete a message containing obscene language', async () => {
        const update = new MessageMockUpdate('він сказав дебіл').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(
          outgoingRequests.buildMethods(['getChatMember', 'deleteMessage', 'getChat', 'sendMessage', 'sendMessage']),
        );
      });

      it('should not delete a clean message', async () => {
        const update = new MessageMockUpdate('Привіт, як справи сьогодні?').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember']));
      });
    });

    describe('warn-obscene feature', () => {
      beforeAll(() => {
        chatSession.chatSettings = { ...baseIsolatedSettings, enableWarnObscene: true } as unknown as typeof chatSession.chatSettings;
      });

      it('should warn without deleting a message with obscene language', async () => {
        const update = new MessageMockUpdate('він сказав дебіл').build();

        await bot.handleUpdate(update);

        const methods = outgoingRequests.getMethods();

        expect(methods).toEqual(outgoingRequests.buildMethods(['getChatMember', 'getChat', 'sendMessage', 'sendMessage']));
        expect(methods).not.toContain('deleteMessage');
      });

      it('should not warn for a clean message', async () => {
        const update = new MessageMockUpdate('Привіт, як справи сьогодні?').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember']));
      });
    });

    describe('no-antisemitism feature', () => {
      beforeAll(() => {
        chatSession.chatSettings = {
          ...baseIsolatedSettings,
          disableDeleteAntisemitism: false,
        } as unknown as typeof chatSession.chatSettings;
      });

      it('should delete a message containing antisemitism', async () => {
        const update = new MessageMockUpdate('этих евреев нужно сжигать. по другому никак').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(
          outgoingRequests.buildMethods(['getChatMember', 'deleteMessage', 'getChat', 'sendMessage', 'sendMessage']),
        );
      });

      it('should not delete a clean message', async () => {
        const update = new MessageMockUpdate('Привіт, як справи сьогодні?').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember']));
      });
    });

    describe('nsfw-message-filter feature', () => {
      beforeAll(() => {
        chatSession.chatSettings = {
          ...baseIsolatedSettings,
          disableNsfwFilter: false,
        } as unknown as typeof chatSession.chatSettings;
      });

      it('should not delete a clean message even when NSFW filter is enabled', async () => {
        // Note: The NSFW detection relies on dynamic data loaded from Google Sheets.
        // In unit-testing mode that data is not available, so only the pipeline
        // routing (chatSettings gate, getChatMember admin check) is verified here.
        // The actual NSFW detection is covered by the nsfw-message-filter unit spec.
        const update = new MessageMockUpdate('Я додам нові фотографії зими з новорічної події').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember']));
      });
    });

    describe('no-counteroffensive feature', () => {
      beforeAll(() => {
        chatSession.chatSettings = {
          ...baseIsolatedSettings,
          enableDeleteCounteroffensive: true,
        } as unknown as typeof chatSession.chatSettings;
      });

      it('should not delete a regular informational message', async () => {
        // Note: The counteroffensive detection relies on dynamic triggers loaded from Google
        // Sheets. In unit-testing mode those triggers are empty, so only the pipeline routing
        // (chatSettings gate, getChatMember admin check) is verified here.
        // The actual counteroffensive detection is covered by the no-counteroffensive unit spec.
        const update = new MessageMockUpdate('Привіт, як справи сьогодні?').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember']));
      });
    });

    describe('no-channel-messages feature', () => {
      beforeAll(() => {
        chatSession.chatSettings = {
          ...baseIsolatedSettings,
          enableDeleteChannelMessages: true,
        } as unknown as typeof chatSession.chatSettings;
      });

      it('should delete a message sent by a channel (Channel_Bot with different sender and parent)', async () => {
        const update = new MessageMockUpdate('Channel announcement').buildOverwrite({
          message: {
            from: { id: 136_817_688, username: 'Channel_Bot', is_bot: false, first_name: '' },
            sender_chat: { id: 12_345, type: 'channel', title: 'Another Channel' },
            reply_to_message: {
              message_id: 1,
              date: 0,
              chat: { id: 202_212, type: 'supergroup', title: 'GrammyMock' },
              sender_chat: { id: 54_321, type: 'channel', title: 'Main Channel' },
              reply_to_message: undefined,
            },
          },
        });

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(
          outgoingRequests.buildMethods(['getChatMember', 'deleteMessage', 'getChat', 'sendMessage', 'sendMessage']),
        );
      });

      it('should not delete a regular user message', async () => {
        const update = new MessageMockUpdate('Regular user message').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember']));
      });
    });

    describe('denylist feature', () => {
      beforeAll(() => {
        chatSession.chatSettings = {
          ...baseIsolatedSettings,
          enableDeleteDenylist: true,
          denylist: ['badword'],
        } as unknown as typeof chatSession.chatSettings;
      });

      it('should delete a message containing a denylisted word', async () => {
        const update = new MessageMockUpdate('This contains badword in the text').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(
          outgoingRequests.buildMethods(['getChatMember', 'deleteMessage', 'getChat', 'sendMessage', 'sendMessage']),
        );
      });

      it('should not delete a message without a denylisted word', async () => {
        const update = new MessageMockUpdate('Привіт, як справи сьогодні?').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember']));
      });
    });

    describe('no-locations feature', () => {
      beforeAll(() => {
        chatSession.chatSettings = {
          ...baseIsolatedSettings,
          enableDeleteLocations: true,
        } as unknown as typeof chatSession.chatSettings;
      });

      it('should delete a message containing a location hint', async () => {
        const update = new MessageMockUpdate('Тут ТеРемкИ без сВітла').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(
          outgoingRequests.buildMethods(['getChatMember', 'deleteMessage', 'getChat', 'sendMessage', 'sendMessage']),
        );
      });

      it('should not delete a message without a location', async () => {
        const update = new MessageMockUpdate('Привіт, як справи сьогодні?').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember']));
      });
    });

    describe('no-forwards feature', () => {
      beforeAll(() => {
        chatSession.chatSettings = {
          ...baseIsolatedSettings,
          enableDeleteForwards: true,
        } as unknown as typeof chatSession.chatSettings;
      });

      it('should delete a forwarded message', async () => {
        const update = new MessageMockUpdate('Forwarded content').buildOverwrite({
          message: {
            forward_origin: {
              type: 'user',
              sender_user: { id: 12_345, first_name: 'Test', is_bot: false },
              date: 1_000_000,
            },
          },
        });

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember', 'deleteMessage', 'sendMessage']));
      });

      it('should not delete a non-forwarded message', async () => {
        const update = new MessageMockUpdate('Привіт, як справи сьогодні?').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember']));
      });
    });

    describe('no-urls feature', () => {
      beforeAll(() => {
        chatSession.chatSettings = {
          ...baseIsolatedSettings,
          enableDeleteUrls: true,
        } as unknown as typeof chatSession.chatSettings;
      });

      it('should delete a message containing a URL', async () => {
        const update = new MessageMockUpdate('Перейдіть на https://example.com для деталей').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(
          outgoingRequests.buildMethods(['getChatMember', 'deleteMessage', 'getChat', 'sendMessage', 'sendMessage']),
        );
      });

      it('should not delete a message without URLs', async () => {
        const update = new MessageMockUpdate('Привіт, як справи сьогодні?').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember']));
      });
    });

    describe('no-mentions feature', () => {
      beforeAll(() => {
        chatSession.chatSettings = {
          ...baseIsolatedSettings,
          enableDeleteMentions: true,
        } as unknown as typeof chatSession.chatSettings;
      });

      it('should delete a message containing a @mention', async () => {
        const update = new MessageMockUpdate('Привіт @testuser чи зможеш допомогти?').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(
          outgoingRequests.buildMethods(['getChatMember', 'deleteMessage', 'getChat', 'sendMessage', 'sendMessage']),
        );
      });

      it('should not delete a message without mentions', async () => {
        const update = new MessageMockUpdate('Привіт, як справи сьогодні?').build();

        await bot.handleUpdate(update);

        expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember']));
      });
    });
  });

  describe('join and leave events', () => {
    beforeAll(() => {
      chatSession.isBotAdmin = true;
      chatSession.botRemoved = false;

      chatSession.chatSettings = {
        disableDeleteServiceMessage: false,
        ...baseIsolatedSettings,
      } as unknown as typeof chatSession.chatSettings;
    });

    beforeEach(() => {
      outgoingRequests.clear();
    });

    it('should delete new member service message when bot is admin', async () => {
      const update = new NewMemberMockUpdate().build();

      await bot.handleUpdate(update);

      // beforeAnyComposer calls getChatMember for all message types; joinLeaveComposer then deletes
      expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember', 'deleteMessage']));
    });

    it('should delete left member service message when bot is admin', async () => {
      const update = new LeftMemberMockUpdate().build();

      await bot.handleUpdate(update);

      // beforeAnyComposer calls getChatMember for all message types; joinLeaveComposer then deletes
      expect(outgoingRequests.getMethods()).toEqual(outgoingRequests.buildMethods(['getChatMember', 'deleteMessage']));
    });
  });
});
