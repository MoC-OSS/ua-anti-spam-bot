/* eslint-disable no-param-reassign,unicorn/prefer-module */
import type { Bot } from 'grammy';
import { GrammyError } from 'grammy';
import { forEach } from 'p-iteration';
/**
 * @deprecated
 * @description
 * This migration is created for prod from user sessions and chat info to chat based sessions.
 *
 * Deleted in
 * feat(UABOT-41): remove extra migration
 * */
import Queue from 'queue-promise';

import { logsChat } from './creator';
import { redisClient } from './db';
import { redisService } from './services';
import type { ChatSessionData, GrammyContext, SessionData } from './types';
import { handleError } from './utils';

const getChatId = (sessionId: string) => sessionId.split(':')[0];

/**
 * @param {Bot} bot
 * @param {Date} botStartDate
 * */
const migration = async (bot: Bot<GrammyContext>, botStartDate: Date) => {
  const compareDate = `${botStartDate.getFullYear()}-${botStartDate.getMonth() + 1}-${botStartDate.getDate()}`;

  if (compareDate !== '2022-4-10') {
    console.info('Skip migration:', __filename);
    return;
  }

  const queue = new Queue({
    concurrent: 1,
    interval: 5000,
    start: false,
  });

  /**
   * @type {Session[]}
   * */
  const userRecords = await redisService.getUserSessions();
  const uniqueUserRecords = userRecords.filter(
    (session, index, self) => index === self.findIndex((t) => getChatId(t.id) === getChatId(session.id)),
  );

  const nonUniqueUserRecords = userRecords.filter((session) => uniqueUserRecords.some((record) => session.id !== record.id));

  console.info({ uniqueUserRecords: uniqueUserRecords.length, nonUniqueUserRecords: nonUniqueUserRecords.length });

  bot.api
    .sendMessage(
      logsChat,
      JSON.stringify({ uniqueUserRecords: uniqueUserRecords.length, nonUniqueUserRecords: nonUniqueUserRecords.length }),
    )
    .catch(handleError);

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  await forEach(nonUniqueUserRecords, (record) => redisClient.removeKey(record.id));

  // eslint-disable-next-line no-restricted-syntax
  uniqueUserRecords.forEach((record) => {
    const chatId = getChatId(record.id);

    /**
     * @type {ChatSessionData & SessionData}
     * */
    let chatSessionRecord: Partial<ChatSessionData & SessionData> = {};

    const clearObject = (object: Partial<ChatSessionData & SessionData>) => {
      delete object.step;
      delete object.textEntities;
      delete object.updatesText;
      delete object.isCurrentUserAdmin;
    };

    // eslint-disable-next-line no-await-in-loop
    queue.enqueue(async () => {
      try {
        const chat = await bot.api.getChat(chatId);
        chatSessionRecord.chatType = chat.type;
        chatSessionRecord.botRemoved = false;

        if (chat.type !== 'private') {
          chatSessionRecord.chatTitle = chat.title;
          chatSessionRecord.chatMembersCount = await bot.api.getChatMemberCount(chatId);

          const admins = await bot.api.getChatAdministrators(chatId);
          const isBotAdmin = (admins || []).some((admin) => admin.user.id === bot.botInfo.id);
          chatSessionRecord.isBotAdmin = isBotAdmin;

          if (isBotAdmin) {
            chatSessionRecord.botAdminDate = new Date();
          }
        }

        await redisService.updateChatSession(chatId, chatSessionRecord);
        await redisClient.removeKey(record.id);

        clearObject(chatSessionRecord);

        console.info(`** Chat id has been migrated: ${record.id}`);
      } catch (error) {
        if (error instanceof GrammyError) {
          switch (error.description) {
            case 'Bad Request: chat not found':
            case 'Bad Request: group chat was upgraded to a supergroup chat': {
              return redisClient.removeKey(record.id);
            }

            case 'Forbidden: bot was kicked from the supergroup chat':
            case 'Forbidden: bot was kicked from the group chat': {
              chatSessionRecord = {
                ...chatSessionRecord,
                ...record.data,
              };

              chatSessionRecord.botRemoved = true;
              chatSessionRecord.isBotAdmin = false;
              delete chatSessionRecord.botAdminDate;

              await redisService.updateChatSession(chatId, chatSessionRecord).then(() => redisClient.removeKey(record.id));
              break;
            }

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            case /Too Many Requests: retry after/.test(error.description): {
              throw error;
            }

            default: {
              throw error;
            }
          }
        }
      }
    });
  });

  while (queue.shouldRun) {
    if (queue.size > 0 && queue.size % 100 === 0) {
      bot.api.sendMessage(logsChat, `** Migration queue size: ${queue.size}`).catch(handleError);
    }

    // eslint-disable-next-line no-await-in-loop
    await queue.dequeue();
  }

  return true;
};

export default migration;
