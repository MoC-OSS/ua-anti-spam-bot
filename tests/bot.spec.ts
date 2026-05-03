import type { Channel, Chats, Supergroup, User } from '@grammyjs/testing';
import { prepareBot } from '@grammyjs/testing';
import { Bot } from 'grammy';

import { getBot } from '@bot';
import { logsChat, secondLogsChat } from '@bot/creator';

import { environmentConfig } from '@shared/config';

import type { GrammyContext } from '@app-types/context';

// eslint-disable-next-line vitest/no-mocks-import
import { realSwindlerMessage } from './__mocks__/bot.mocks';
import { mockChatSession, mockSession } from './helpers/session-mocks';

/**
 * Enable unit testing
 */
Object.assign(environmentConfig, { UNIT_TESTING: true, DISABLE_LOGS_CHAT: false, DEBUG: false, AWS_REGION: 'us-east-1' });

let chats: Chats<GrammyContext>;
let user: User<GrammyContext>;
let group: Supergroup<GrammyContext>;
let channel: Channel<GrammyContext>;
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

describe('e2e bot testing', () => {
  beforeAll(async () => {
    const initialBot = new Bot<GrammyContext>(environmentConfig?.BOT_TOKEN || 'test');

    // Add mock session data
    initialBot.use(mockSessionMiddleware);
    initialBot.use(mockChatSessionMiddleware);

    bot = await getBot(initialBot);

    ({ chats } = await prepareBot<GrammyContext>(bot));

    user = chats.newUser();
    group = chats.newSupergroup();
    channel = chats.newChannel();
  }, 15_000);

  describe('private flow', () => {
    describe('public commands', () => {
      beforeEach(() => {
        chats.clear();
        chatSession.language = undefined;
        delete session.roleMode;
      });

      it('should handle /language in private chat', async () => {
        await user.sendCommand('/language');

        expect(chatSession.language).toBe('en');
        expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['deleteMessage', 'sendMessage']));
      });

      it('should handle /role in private chat', async () => {
        await user.sendCommand('/role');

        expect(session.roleMode).toBeUndefined();
        expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['deleteMessage', 'sendMessage']));
      });
    });

    describe('check regular message', () => {
      beforeEach(() => {
        chats.clear();
      });

      it('should not remove a regular message and have 0 api calls', async () => {
        await user.sendText('regular message');

        expect(chats.outgoing).toHaveLength(0);
      });

      it('should remove a swindler message and notify for first swindler in several hours', async () => {
        await user.sendText(realSwindlerMessage);

        const expectedMethods = chats.outgoing.buildMethods(['getChat', 'sendMessage', 'sendMessage', 'sendMessage', 'deleteMessage']);

        const [, sendLogsMessageRequest, sendSecondLogsMessageRequest] = chats.outgoing.getAll<
          'getChat',
          'sendMessage',
          'sendMessage',
          'sendMessage',
          'deleteMessage'
        >();

        const actualMethods = chats.outgoing.getMethods();

        expect(expectedMethods).toEqual(actualMethods);
        expect(sendLogsMessageRequest?.payload.chat_id).toEqual(logsChat);
        expect(sendSecondLogsMessageRequest?.payload.chat_id).toEqual(secondLogsChat);
        expect(chats.outgoing).toHaveLength(5);
      });

      it('should remove a swindler message and dont notify after already notified', async () => {
        await user.sendText(realSwindlerMessage);

        const expectedMethods = chats.outgoing.buildMethods(['getChat', 'sendMessage', 'sendMessage', 'deleteMessage']);

        const [, sendLogsMessageRequest, sendSecondLogsMessageRequest] = chats.outgoing.getAll<
          'getChat',
          'sendMessage',
          'sendMessage',
          'deleteMessage'
        >();

        const actualMethods = chats.outgoing.getMethods();

        expect(expectedMethods).toEqual(actualMethods);
        expect(sendLogsMessageRequest?.payload.chat_id).toEqual(logsChat);
        expect(sendSecondLogsMessageRequest?.payload.chat_id).toEqual(secondLogsChat);
        expect(chats.outgoing).toHaveLength(4);
      });
    });
  });

  describe('group or super group flow', () => {
    describe('public commands', () => {
      beforeEach(() => {
        chats.clear();
        chatSession.language = undefined;
        chatSession.isBotAdmin = true;
        delete session.roleMode;
      });

      it('should reject /language in a group for a non-admin user', async () => {
        await user.sendCommand('/language', undefined, { chat: group });

        expect(chatSession.language).toBeUndefined();
        expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember', 'deleteMessage', 'sendMessage']));
      });

      it('should reject /role in a group for a non-admin user', async () => {
        await user.sendCommand('/role', undefined, { chat: group });

        expect(session.roleMode).toBeUndefined();
        expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember', 'deleteMessage', 'sendMessage']));
      });
    });

    describe('check regular message', () => {
      beforeEach(() => {
        chats.clear();
      });

      it('should check is bot admin if isAdmin is empty', async () => {
        chatSession.isBotAdmin = undefined;
        await user.sendText('regular message', { chat: group });
        const [getChatAdminsRequest, getChatMemberRequest] = chats.outgoing.getTwoLast<'getChatAdministrators', 'getChatMember'>();

        expect(getChatAdminsRequest?.method).toEqual('getChatAdministrators');
        expect(getChatMemberRequest?.method).toEqual('getChatMember');
        expect(chats.outgoing.length).toEqual(2);
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
          await user.sendText('regular message', { chat: group });

          const getChatMemberRequest = chats.outgoing.getFirst<'getChatMember'>();

          expect(getChatMemberRequest?.method).toEqual('getChatMember');
          expect(getChatMemberRequest?.payload.user_id).toEqual(user.id);
        });

        it('should request chat info if no is removed info', async () => {
          // eslint-disable-next-line sonarjs/different-types-comparison
          if (chatSession.botRemoved !== undefined) {
            // @ts-ignore
            delete chatSession.botRemoved;
          }

          await user.sendText('regular message', { chat: group });

          const [getChatRequest, getChatMemberRequest] = chats.outgoing.getTwoLast<'getChat', 'getChatMember'>();

          expect(chats.outgoing).toHaveLength(2);
          expect(getChatRequest?.method).toEqual('getChat');
          expect(getChatMemberRequest?.method).toEqual('getChatMember');
        });

        it('should not remove a super group message', async () => {
          await user.sendText('regular message', { chat: group });

          expect(chats.outgoing).toHaveLength(1);
        });

        it('should remove a swindler message and notify for first swindler in several hours', async () => {
          chatSession.lastWarningDate = new Date(0);
          await user.sendText(realSwindlerMessage, { chat: group });

          const expectedMethods = chats.outgoing.buildMethods([
            'getChatMember',
            'getChat',
            'sendMessage',
            'sendMessage',
            'sendMessage',
            'deleteMessage',
          ]);

          const requests = chats.outgoing.getAll<
            'getChatMember',
            'getChat',
            'sendMessage',
            'sendMessage',
            'sendMessage',
            'deleteMessage'
          >();

          const sendLogsMessageRequest = requests[2];
          const sendSecondLogsMessageRequest = requests[3];

          const actualMethods = chats.outgoing.getMethods();

          expect(expectedMethods).toEqual(actualMethods);
          expect(sendLogsMessageRequest?.payload.chat_id).toEqual(logsChat);
          expect(sendSecondLogsMessageRequest?.payload.chat_id).toEqual(secondLogsChat);
        });

        it('should remove a swindler message and dont notify after already notified', async () => {
          chatSession.lastWarningDate = new Date();
          await user.sendText(realSwindlerMessage, { chat: group });

          const expectedMethods = chats.outgoing.buildMethods(['getChatMember', 'getChat', 'sendMessage', 'sendMessage', 'deleteMessage']);

          const requests = chats.outgoing.getAll<'getChatMember', 'getChat', 'sendMessage', 'sendMessage', 'deleteMessage'>();
          const sendLogsMessageRequest = requests[2];
          const sendSecondLogsMessageRequest = requests[3];

          const actualMethods = chats.outgoing.getMethods();

          expect(expectedMethods).toEqual(actualMethods);
          expect(sendLogsMessageRequest?.payload.chat_id).toEqual(logsChat);
          expect(sendSecondLogsMessageRequest?.payload.chat_id).toEqual(secondLogsChat);
        });

        it('should delete swindler message if they are send in media group', async () => {
          await user.sendMediaGroup([{ caption: realSwindlerMessage }, {}, {}], { chat: group });

          const expectedMethods = chats.outgoing.buildMethods([
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

          const actualMethods = chats.outgoing.getMethods();

          expect(actualMethods.filter((method) => method === 'deleteMessage')).toHaveLength(3);
          expect(expectedMethods).toEqual(actualMethods);
        });

        it('should delete swindler message if they are send in media group but dont delete another group', async () => {
          await user.sendMediaGroup([{ caption: realSwindlerMessage }, {}], { chat: group });
          await user.sendMediaGroup([{ caption: 'just a regular message' }, {}], { chat: group });

          const actualMethods = chats.outgoing.getMethods();

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
      chats.clear();
    });

    describe('no-russian feature', () => {
      beforeAll(() => {
        chatSession.chatSettings = { ...baseIsolatedSettings, enableDeleteRussian: true } as unknown as typeof chatSession.chatSettings;
      });

      it('should delete a russian language message', async () => {
        await user.sendText('съешь еще этих французских булок', { chat: group });

        expect(chats.outgoing.getMethods()).toEqual(
          chats.outgoing.buildMethods(['getChatMember', 'deleteMessage', 'getChat', 'sendMessage', 'sendMessage']),
        );
      });

      it('should not delete a ukrainian language message', async () => {
        await user.sendText('Привіт, як справи сьогодні?', { chat: group });

        expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember']));
      });
    });

    describe('warn-russian feature', () => {
      beforeAll(() => {
        chatSession.chatSettings = { ...baseIsolatedSettings, enableWarnRussian: true } as unknown as typeof chatSession.chatSettings;
      });

      it('should warn without deleting a russian language message', async () => {
        await user.sendText('съешь еще этих французских булок', { chat: group });

        const methods = chats.outgoing.getMethods();

        expect(methods).toEqual(chats.outgoing.buildMethods(['getChatMember', 'getChat', 'sendMessage', 'sendMessage']));
        expect(methods).not.toContain('deleteMessage');
      });

      it('should not warn for a ukrainian language message', async () => {
        await user.sendText('Привіт, як справи сьогодні?', { chat: group });

        expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember']));
      });
    });

    describe('no-obscene feature', () => {
      beforeAll(() => {
        chatSession.chatSettings = { ...baseIsolatedSettings, enableDeleteObscene: true } as unknown as typeof chatSession.chatSettings;
      });

      it('should delete a message containing obscene language', async () => {
        await user.sendText('він сказав дебіл', { chat: group });

        expect(chats.outgoing.getMethods()).toEqual(
          chats.outgoing.buildMethods(['getChatMember', 'deleteMessage', 'getChat', 'sendMessage', 'sendMessage']),
        );
      });

      it('should not delete a clean message', async () => {
        await user.sendText('Привіт, як справи сьогодні?', { chat: group });

        expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember']));
      });
    });

    describe('warn-obscene feature', () => {
      beforeAll(() => {
        chatSession.chatSettings = { ...baseIsolatedSettings, enableWarnObscene: true } as unknown as typeof chatSession.chatSettings;
      });

      it('should warn without deleting a message with obscene language', async () => {
        await user.sendText('він сказав дебіл', { chat: group });

        const methods = chats.outgoing.getMethods();

        expect(methods).toEqual(chats.outgoing.buildMethods(['getChatMember', 'getChat', 'sendMessage', 'sendMessage']));
        expect(methods).not.toContain('deleteMessage');
      });

      it('should not warn for a clean message', async () => {
        await user.sendText('Привіт, як справи сьогодні?', { chat: group });

        expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember']));
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
        await user.sendText('этих евреев нужно сжигать. по другому никак', { chat: group });

        expect(chats.outgoing.getMethods()).toEqual(
          chats.outgoing.buildMethods(['getChatMember', 'deleteMessage', 'getChat', 'sendMessage', 'sendMessage']),
        );
      });

      it('should not delete a clean message', async () => {
        await user.sendText('Привіт, як справи сьогодні?', { chat: group });

        expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember']));
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
        await user.sendText('Я додам нові фотографії зими з новорічної події', { chat: group });

        expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember']));
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
        await user.sendText('Привіт, як справи сьогодні?', { chat: group });

        expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember']));
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
        await channel.postMessageTo(group, 'Channel announcement');

        expect(chats.outgoing.getMethods()).toEqual(
          chats.outgoing.buildMethods(['getChatMember', 'deleteMessage', 'getChat', 'sendMessage', 'sendMessage']),
        );
      });

      it('should not delete a regular user message', async () => {
        await user.sendText('Regular user message', { chat: group });

        expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember']));
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
        await user.sendText('This contains badword in the text', { chat: group });

        expect(chats.outgoing.getMethods()).toEqual(
          chats.outgoing.buildMethods(['getChatMember', 'deleteMessage', 'getChat', 'sendMessage', 'sendMessage']),
        );
      });

      it('should not delete a message without a denylisted word', async () => {
        await user.sendText('Привіт, як справи сьогодні?', { chat: group });

        expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember']));
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
        await user.sendText('Тут ТеРемкИ без сВітла', { chat: group });

        expect(chats.outgoing.getMethods()).toEqual(
          chats.outgoing.buildMethods(['getChatMember', 'deleteMessage', 'getChat', 'sendMessage', 'sendMessage']),
        );
      });

      it('should not delete a message without a location', async () => {
        await user.sendText('Привіт, як справи сьогодні?', { chat: group });

        expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember']));
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
        await user.sendForwarded('Forwarded content', {
          forwardOrigin: { type: 'user', sender_user: { id: 12_345, first_name: 'Test', is_bot: false }, date: 1_000_000 },
          chat: group,
        });

        expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember', 'deleteMessage', 'sendMessage']));
      });

      it('should not delete a non-forwarded message', async () => {
        await user.sendText('Привіт, як справи сьогодні?', { chat: group });

        expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember']));
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
        await user.sendText('Перейдіть на https://example.com для деталей', { chat: group });

        expect(chats.outgoing.getMethods()).toEqual(
          chats.outgoing.buildMethods(['getChatMember', 'deleteMessage', 'getChat', 'sendMessage', 'sendMessage']),
        );
      });

      it('should not delete a message without URLs', async () => {
        await user.sendText('Привіт, як справи сьогодні?', { chat: group });

        expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember']));
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
        await user.sendText('Привіт @testuser чи зможеш допомогти?', { chat: group });

        expect(chats.outgoing.getMethods()).toEqual(
          chats.outgoing.buildMethods(['getChatMember', 'deleteMessage', 'getChat', 'sendMessage', 'sendMessage']),
        );
      });

      it('should not delete a message without mentions', async () => {
        await user.sendText('Привіт, як справи сьогодні?', { chat: group });

        expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember']));
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
      chats.clear();
    });

    it('should delete new member service message when bot is admin', async () => {
      await user.joinChat(group);

      // beforeAnyComposer calls getChatMember for all message types; joinLeaveComposer then deletes
      expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember', 'deleteMessage']));
    });

    it('should delete left member service message when bot is admin', async () => {
      await user.leaveChat(group);

      // beforeAnyComposer calls getChatMember for all message types; joinLeaveComposer then deletes
      expect(chats.outgoing.getMethods()).toEqual(chats.outgoing.buildMethods(['getChatMember', 'deleteMessage']));
    });
  });
});
