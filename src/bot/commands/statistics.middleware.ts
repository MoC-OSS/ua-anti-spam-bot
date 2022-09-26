const { redisService } = require('../../services/redis.service');

const { handleError, formatDate } = require('../../utils');
const { getStatisticsMessage } = require('../../message');

export class StatisticsMiddleware {
  /**
   * @param {Date} startTime
   * */
  startTime: Date;
  constructor(startTime: Date) {
    this.startTime = startTime;
  }

  /**
   * Handle /statistics
   * Returns current statistics
   * */
  middleware() {
    /**
     * @param {GrammyContext} ctx
     * */
    return async (ctx) => {
      try {
        await ctx.replyWithChatAction('typing');
        const chatSessions = await redisService.getChatSessions();

        const superGroupsSessions = chatSessions.filter((session) => session.data.chatType === 'supergroup');
        const groupSessions = chatSessions.filter((session) => session.data.chatType === 'group');
        const privateSessions = chatSessions.filter((session) => session.data.chatType === 'private');
        const channelSessions = chatSessions.filter((session) => session.data.chatType === 'channel');

        const totalSessionCount = chatSessions.length;
        const superGroupsCount = superGroupsSessions.length;
        const groupCount = groupSessions.length;
        const privateCount = privateSessions.length;
        const channelCount = channelSessions.length;
        const totalUserCounts = chatSessions
          .filter((session) => !session.data.botRemoved)
          .reduce((accumulator, session) => accumulator + (session.data.chatMembersCount || 1), 0);

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
        await ctx.reply('Cannot get statistics');
      }
    };
  }
}
