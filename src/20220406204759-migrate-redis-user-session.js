/**
 * @deprecated
 * @description
 * This migration is created for prod from user sessions and chat info to chat based sessions.
 * */

const { redisClient } = require('./db');
const { redisService } = require('./services/redis.service');

/**
 * @param {Bot} bot
 * @param {Date} botStartDate
 * */
module.exports = async (bot, botStartDate) => {
  const compareDate = `${botStartDate.getFullYear()}-${botStartDate.getMonth() + 1}-${botStartDate.getDate()}`;

  if (compareDate !== '2022-4-10') {
    console.info('Skip migration: ', __filename);
    return;
  }

  /**
   * @type {Session[]}
   * */
  const userRecords = await redisService.getUserSessions();

  const getChatId = (sessionId) => sessionId.split(':')[0];
  const uniqueUserRecords = userRecords.filter(
    (session, index, self) => index === self.findIndex((t) => getChatId(t.id) === getChatId(session.id)),
  );

  // eslint-disable-next-line no-restricted-syntax
  for (const record1 of uniqueUserRecords) {
    const chatId = record1.id.split(':')[0];

    /**
     * @type {ChatSessionData & SessionData}
     * */
    let chatSessionRecord = {};

    (async () => {
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
        await redisClient.removeKey(record1.id);

        console.info(`** Chat id has been migrated: ${record1.id}`);
      } catch (e) {
        console.info('Bot probably kicked: ', e);
        chatSessionRecord = {
          ...chatSessionRecord,
          ...record1.data,
        };

        chatSessionRecord.botRemoved = true;
        chatSessionRecord.isBotAdmin = false;
        delete chatSessionRecord.botAdminDate;

        redisService.updateChatSession(chatId, chatSessionRecord).then(() => redisClient.removeKey(record1.id));
      }
    })().then();
  }
};
