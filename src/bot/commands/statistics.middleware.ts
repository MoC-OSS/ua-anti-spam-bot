import { getStatisticsMessage } from '../../message';
import { redisService } from '../../services';
import type { GrammyContext } from '../../types';
import { formatDate, handleError } from '../../utils';

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
    return async (context: GrammyContext) => {
      try {
        await context.replyWithChatAction('typing');
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

        await context.replyWithHTML(
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
      } catch (error) {
        handleError(error);
        await context.reply('Cannot get statistics');
      }
    };
  }
}
