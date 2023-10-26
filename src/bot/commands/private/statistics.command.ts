import { InputFile } from 'grammy';
import moment from 'moment-timezone';

import { getChatStatisticsMessage, getFeaturesStatisticsMessage } from '../../../message';
import { redisService } from '../../../services';
import { statisticsGoogleService } from '../../../services/statistics-google.service';
import type { FeaturesSessionsData, GrammyMiddleware } from '../../../types';
import { handleError, optimizeWriteContextUtil } from '../../../utils';

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
          disableDeleteAntisemitism: 0,
          enableDeleteCards: 0,
          enableDeleteUrls: 0,
          enableDeleteLocations: 0,
          enableDeleteMentions: 0,
          enableDeleteForwards: 0,
          enableDeleteCounteroffensive: 0,
          enableDeleteRussian: 0,
          enableWarnRussian: 0,
          enableDeleteObscene: 0,
          enableWarnObscene: 0,
        };

        chatSessions
          .filter((session) => session.data.chatSettings && session.data.chatSettings.airRaidAlertSettings)
          .forEach((session) => {
            Object.keys(features).forEach((key) => {
              features[key] +=
                key === 'notificationMessage' ? +session.data.chatSettings.airRaidAlertSettings[key] : +!!session.data.chatSettings[key];
            });
          });

        await context.replyWithHTML(
          getChatStatisticsMessage({
            adminsChatsCount,
            botRemovedCount,
            channelCount,
            groupCount,
            memberChatsCount,
            privateCount,
            superGroupsCount,
            totalSessionCount,
            totalUserCounts,
          }),
        );
        await context.replyWithHTML(
          getFeaturesStatisticsMessage({
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
        const writeContext = optimizeWriteContextUtil(context);
        const chatSessions = await redisService.getChatSessions();

        handleError(error);
        await context
          .reply(`<b>Bot statistics failed with message:</b>\n${(error as Error).message}`)
          .catch(() => context.reply('cannot send error message.'));
        await context
          .reply(`<b>Stack:</b>\n<code>${(error as Error).stack || ''}</code>`)
          .catch(() => context.reply('cannot send error trace'));
        await context
          .replyWithDocument(new InputFile(Buffer.from(JSON.stringify(writeContext, null, 2)), `ctx-${new Date().toISOString()}.json`))
          .catch(() => context.reply('cannot send context'));
        await context
          .replyWithDocument(new InputFile(Buffer.from(JSON.stringify(error, null, 2)), `error-${new Date().toISOString()}.json`))
          .catch(() => context.reply('cannot send error file'));
        await context
          .replyWithDocument(
            new InputFile(Buffer.from(JSON.stringify(chatSessions, null, 2)), `chatSessions-${new Date().toISOString()}.json`),
          )
          .catch(() => context.reply('cannot send error file'));

        await context.reply('Cannot get statistics');
      }
    };
  }
}
