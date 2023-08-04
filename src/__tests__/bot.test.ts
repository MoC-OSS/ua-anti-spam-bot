import { Bot } from 'grammy';

// eslint-disable-next-line jest/no-mocks-import
import { realSwindlerMessage } from '../__mocks__/bot.mocks';
import { getBot } from '../bot';
import { environmentConfig } from '../config';
import { logsChat, secondLogsChat } from '../creator';
import type { OutgoingRequests } from '../testing';
import { MessagePrivateMockUpdate, MessageSuperGroupMockUpdate, prepareBotForTesting } from '../testing';
import { mockChatSession, mockSession } from '../testing-main';
import type { GrammyContext } from '../types';

/**
 * Enable unit testing
 * */
environmentConfig.UNIT_TESTING = true;
environmentConfig.DISABLE_LOGS_CHAT = false;
environmentConfig.DEBUG = false;

let outgoingRequests: OutgoingRequests;
let bot: Bot<GrammyContext>;

const { mockSessionMiddleware } = mockSession({});
const { chatSession, mockChatSessionMiddleware } = mockChatSession({
  isBotAdmin: true,
  botRemoved: false,
});

describe('e2e bot testing', () => {
  beforeAll(async () => {
    const initialBot = new Bot<GrammyContext>(environmentConfig?.BOT_TOKEN);

    // Add mock session data
    initialBot.use(mockSessionMiddleware);
    initialBot.use(mockChatSessionMiddleware);

    bot = await getBot(initialBot);
    outgoingRequests = await prepareBotForTesting<GrammyContext>(bot, {
      getChat: {},
    });
  }, 15_000);

  describe('private flow', () => {
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
    describe('check regular message', () => {
      beforeEach(() => {
        outgoingRequests.clear();
      });

      it('should check is bot admin if isAdmin is empty', async () => {
        chatSession.isBotAdmin = undefined;

        const update = new MessageSuperGroupMockUpdate('regular message').build();
        await bot.handleUpdate(update);

        const getChatAdminsRequest = outgoingRequests.getLast<'getChatAdministrators'>();

        expect(getChatAdminsRequest?.method).toEqual('getChatAdministrators');
        expect(outgoingRequests.length).toEqual(1);
      });

      describe('bot is admin', () => {
        beforeAll(() => {
          chatSession.isBotAdmin = true;
        });

        beforeEach(() => {
          delete chatSession.lastWarningDate;
        });

        it('should check current user if its an admin to skip them', async () => {
          const update = new MessageSuperGroupMockUpdate('regular message').build();
          await bot.handleUpdate(update);

          const getChatMemberRequest = outgoingRequests.getFirst<'getChatMember'>();

          expect(getChatMemberRequest?.method).toEqual('getChatMember');
          expect(getChatMemberRequest?.payload.user_id).toEqual(update.message.from.id);
        });

        it('should request chat info if no is removed info', async () => {
          if (chatSession.botRemoved !== undefined) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            delete chatSession.botRemoved;
          }

          const update = new MessageSuperGroupMockUpdate('regular message').build();
          await bot.handleUpdate(update);

          const [getChatRequest, getChatMemberRequest] = outgoingRequests.getTwoLast<'getChat', 'getChatMember'>();

          expect(outgoingRequests.requests).toHaveLength(2);
          expect(getChatRequest?.method).toEqual('getChat');
          expect(getChatMemberRequest?.method).toEqual('getChatMember');
        });

        it('should not remove a super group message', async () => {
          const update = new MessageSuperGroupMockUpdate('regular message').build();
          await bot.handleUpdate(update);

          expect(outgoingRequests.requests).toHaveLength(1);
        });

        it('should remove a swindler message and notify for first swindler in several hours', async () => {
          chatSession.lastWarningDate = new Date(0);
          const update = new MessageSuperGroupMockUpdate(realSwindlerMessage).build();
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
          const update = new MessageSuperGroupMockUpdate(realSwindlerMessage).build();
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
          const updateCaption = new MessageSuperGroupMockUpdate('').buildOverwrite({
            message: { media_group_id: '1', photo: [], caption: realSwindlerMessage },
          });
          const updatePhoto2 = new MessageSuperGroupMockUpdate('').buildOverwrite({
            message: { media_group_id: '1', photo: [] },
          });
          const updatePhoto3 = new MessageSuperGroupMockUpdate('').buildOverwrite({
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
            'deleteMessage',
            'getChatMember',
            'deleteMessage',
            'getChatMember',
          ]);

          const actualMethods = outgoingRequests.getMethods();

          expect(actualMethods.filter((method) => method === 'deleteMessage')).toHaveLength(3);
          expect(expectedMethods).toEqual(actualMethods);
        });
      });
    });
  });
});
