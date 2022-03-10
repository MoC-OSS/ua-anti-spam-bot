const { redisClient } = require('../../db');

const { handleError, formatDate } = require('../../utils');
const { getStatisticsMessage } = require('../../message');

class StatisticsMiddleware {
  /**
   * @param {Date} startTime
   * */
  constructor(startTime) {
    this.startTime = startTime;
  }

  /**
   * Handle /statistics
   * Returns current statistics
   * */
  middleware() {
    /**
     * @param {TelegrafContext} ctx
     * */
    return async (ctx) => {
      if (ctx.chat.type === 'supergroup') {
      }

      try {
        /**
         * @type {SessionObject}
         * */
        const sessions = await redisClient.getAllRecords();

        const getChatId = (sessionId) => sessionId.split(':')[0];

        const currentBotSessions = sessions.filter((session) => session.data.botId === ctx.botInfo.id);
        const groupOnlySessions = currentBotSessions.filter(
          (session, index, self) => index === self.findIndex((t) => getChatId(t.id) === getChatId(session.id)),
        );

        const superGroupsSessions = groupOnlySessions.filter((session) => session.data.chatType === 'supergroup');
        const groupSessions = groupOnlySessions.filter((session) => session.data.chatType === 'group');
        const privateSessions = groupOnlySessions.filter((session) => session.data.chatType === 'private');
        const channelSessions = groupOnlySessions.filter((session) => session.data.chatType === 'channel');

        const totalUserCounts = currentBotSessions.length;
        const totalSessionCount = groupOnlySessions.length;
        const superGroupsCount = superGroupsSessions.length;
        const groupCount = groupSessions.length;
        const privateCount = privateSessions.length;
        const channelCount = channelSessions.length;

        const adminsChatsCount = [...superGroupsSessions, ...groupSessions].filter((session) => session.data.isBotAdmin).length;
        const memberChatsCount = [...superGroupsSessions, ...groupSessions].filter((session) => !session.data.isBotAdmin).length;
        const botRemovedCount = [...superGroupsSessions, ...groupSessions].filter((session) => session.data.botRemoved).length;

        ctx.replyWithHTML(
          getStatisticsMessage({
            adminsChatsCount,
            botRemovedCount,
            botStartTime: formatDate(this.startTime),
            channelCount,
            groupCount,
            memberChatsCount,
            privateCount,
            superGroupsCount,
            totalSessionCount,
            totalUserCounts,
          }),
        );
      } catch (e) {
        handleError(e);
        ctx.reply('Cannot get statistics');
      }
    };
  }
}
module.exports = {
  StatisticsMiddleware,
};
