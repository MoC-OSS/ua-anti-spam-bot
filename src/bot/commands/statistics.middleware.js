const fs = require('fs');

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
    return (ctx) => {
      if (ctx.chat.type === 'supergroup') {
      }

      try {
        /**
         * @type {SessionObject}
         * */
        const sessionObject = JSON.parse(fs.readFileSync('./telegraf-session.json').toString());
        const { sessions } = sessionObject;

        const currentBotSessions = sessions.filter((session) => session.data.botId === ctx.botInfo.id);

        const superGroupsSessions = currentBotSessions.filter((session) => session.data.chatType === 'supergroup');
        const groupSessions = currentBotSessions.filter((session) => session.data.chatType === 'group');
        const privateSessions = currentBotSessions.filter((session) => session.data.chatType === 'private');
        const channelSessions = currentBotSessions.filter((session) => session.data.chatType === 'channel');

        const totalSessionCount = currentBotSessions.length;
        const superGroupsCount = superGroupsSessions.length;
        const groupCount = groupSessions.length;
        const privateCount = privateSessions.length;
        const channelCount = channelSessions.length;

        const adminsChatsCount = [...superGroupsSessions, ...groupSessions].filter((session) => session.data.isBotAdmin).length;
        const memberChatsCount = [...superGroupsSessions, ...groupSessions].filter((session) => !session.data.isBotAdmin).length;
        const botRemovedCount = [...superGroupsSessions, ...groupSessions].filter((session) => session.data.botRemoved).length;

        ctx.reply(
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
          }),
          { parse_mode: 'HTML' },
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
