const { redisClient } = require('../../db');

const { handleError, formatDate } = require('../../utils');
const { getStatisticsObjectFromSession } = require('../botUtils');
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
     * @typedef { import("../../types").GrammyContext } GrammyContext
     */
    /**
     * @param {GrammyContext} ctx
     * */
    return async (ctx) => {
      if (ctx.chat.type === 'supergroup') {
      }

      try {
        const sessions = await redisClient.getAllRecords();
        const statisticsObject = getStatisticsObjectFromSession(sessions);

        // @ts-ignore
        ctx.replyWithHTML(
          getStatisticsMessage({
            botStartTime: formatDate(this.startTime),
            adminsChatsCount: statisticsObject.active_admin,
            botRemovedCount: statisticsObject.bot_removed,
            channelCount: statisticsObject.channels,
            groupCount: statisticsObject.groups,
            memberChatsCount: statisticsObject.inactive_admin,
            privateCount: statisticsObject.private_chats,
            superGroupsCount: statisticsObject.super_groups,
            totalSessionCount: statisticsObject.total_chats,
            totalUserCounts: statisticsObject.total_users,
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
