/**
 * @deprecated
 * @description
 * This migration is created for prod from user sessions and chat info to chat based sessions.
 * */

const { redisService } = require('./services/redis.service');

/**
 * @param {Bot} bot
 * @param {Date} botStartDate
 * */
module.exports = async (bot, botStartDate) => {
  const compareDate = `${botStartDate.getFullYear()}-${botStartDate.getMonth() + 1}-${botStartDate.getDate()}-${botStartDate.getHours()}`;

  if (compareDate === '2022-4-10-13') {
    /**
     * @type {Session[]}
     * */
    const chatRecords = await redisService.getUserSessions();

    // eslint-disable-next-line no-restricted-syntax
    for (const record1 of chatRecords) {
      const chatId = record1.id.split(':')[0];

      /**
       * @type {ChatSessionData}
       * */
      let chatSessionRecord = {};

      bot.api
        .getChat(chatId)
        .then((chat) => {
          chatSessionRecord.chatType = chat.type;
          chatSessionRecord.botRemoved = false;

          if (chat.type !== 'private') {
            chatSessionRecord.chatTitle = chat.title;
          }

          return bot.api.getChatMemberCount(chatId);
        })
        .then((count) => {
          chatSessionRecord.chatMembersCount = count;

          return bot.api.getChatAdministrators(chatId);
        })
        .then((admins) => {
          const isBotAdmin = (admins || []).some((admin) => admin.user.id === bot.botInfo.id);
          chatSessionRecord.isBotAdmin = isBotAdmin;

          if (isBotAdmin) {
            chatSessionRecord.botAdminDate = new Date();
          }
        })
        .then(() => {
          redisService.updateChatSession(chatId, chatSessionRecord);
        })
        .catch(() => {
          chatSessionRecord = {
            ...record1.data,
          };

          chatSessionRecord.botRemoved = true;
          chatSessionRecord.isBotAdmin = false;
          delete chatSessionRecord.botAdminDate;

          redisService.updateChatSession(chatId, chatSessionRecord);
        });
    }
  }
};