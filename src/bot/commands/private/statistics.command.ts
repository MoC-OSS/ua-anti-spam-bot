import moment from 'moment-timezone';

import { getStatisticsMessage } from '../../../message';
import { redisService } from '../../../services';
import { statisticsGoogleService } from '../../../services/statistics-google.service';
import type { FeaturesSessionsData, GrammyMiddleware } from '../../../types';
import { handleError } from '../../../utils';

export class StatisticsCommand {
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
        const chatSessions = await redisService.getChatSessions();
        const currentDate = moment().locale('en').format('LLL');

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

        // features

        const features: FeaturesSessionsData = {
          notificationMessage: 0,
          disableChatWhileAirRaidAlert: 0,
          disableStrategicInfo: 0,
          disableDeleteMessage: 0,
          disableSwindlerMessage: 0,
          disableDeleteServiceMessage: 0,
          disableNsfwFilter: 0,
          enableDeleteCards: 0,
          enableDeleteUrls: 0,
          enableDeleteLocations: 0,
          enableDeleteMentions: 0,
          enableDeleteForwards: 0,
          enableDeleteCounteroffensive: 0,
          enableDeleteRussian: 0,
          enableWarnRussian: 0,
        };

        chatSessions.forEach((session) => {
          Object.keys(features).forEach((key) => {
            features[key] +=
              key === 'notificationMessage' ? +session.data.chatSettings.airRaidAlertSettings[key] : +!!session.data.chatSettings[key];
          });
        });

        await context.replyWithHTML(
          getStatisticsMessage({
            adminsChatsCount,
            botRemovedCount,
            channelCount,
            groupCount,
            memberChatsCount,
            privateCount,
            superGroupsCount,
            totalSessionCount,
            totalUserCounts,
            features,
          }),
        );
        await statisticsGoogleService.appendToSheet([
          currentDate,
          totalSessionCount,
          totalUserCounts,
          superGroupsCount,
          groupCount,
          adminsChatsCount,
          memberChatsCount,
          botRemovedCount,
          privateCount,
          channelCount,
          ...Object.values(features),
        ]);
      } catch (error) {
        handleError(error);
        await context.reply('Cannot get statistics');
      }
    };
  }
}
