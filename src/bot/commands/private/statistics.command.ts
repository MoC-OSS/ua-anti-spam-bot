import { getStatisticsMessage } from '../../../message';
import { redisService } from '../../../services';
import type { GrammyMiddleware } from '../../../types';
import { formatDate, handleError } from '../../../utils';

export class StatisticsCommand {
  /**
   * @param {Date} startTime
   * */
  constructor(private startTime: Date) {}

  /**
   * Handle /statistics
   * Returns current statistics
   * */
  middleware(): GrammyMiddleware {
    /**
     * @param {GrammyContext} context
     * */
    return async (context) => {
      try {
        await context.replyWithChatAction('typing');
        const { records, keys } = await redisService.getChatSessions();

        const superGroupsSessions = records.filter((session) => session.data.chatType === 'supergroup');
        const groupSessions = records.filter((session) => session.data.chatType === 'group');
        const privateSessions = records.filter((session) => session.data.chatType === 'private');
        const channelSessions = records.filter((session) => session.data.chatType === 'channel');

        const totalSessionCount = keys.length;
        const superGroupsCount = superGroupsSessions.length;
        const groupCount = groupSessions.length;
        const privateCount = privateSessions.length;
        const channelCount = channelSessions.length;
        const totalUserCounts = records
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
