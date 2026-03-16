import { InputFile } from 'grammy';

import moment from 'moment-timezone';

import { getChatStatisticsMessage, getFeaturesStatisticsMessage } from '@message';

import { redisService } from '@services/redis.service';
import { statisticsGoogleService } from '@services/statistics-google.service';

import type { GrammyMiddleware } from '@app-types/context';
import type { FeaturesSessionsData } from '@app-types/session';

import { handleError } from '@utils/error-handler.util';
import { optimizeWriteContextUtility } from '@utils/optimize-write-context.util';

export class StatisticsCommand {
  /**
   * Handle /statistics
   * Returns current statistics
   */
  middleware(): GrammyMiddleware {
    /**
     * Handles the /statistics command and replies with aggregated bot statistics.
     * @param context
     */
    // eslint-disable-next-line unicorn/consistent-function-scoping
    return async (context) => {
      try {
        await context.replyWithChatAction('typing');
        const chatSessions = await redisService.getChatSessions();
        const currentDate = moment().locale('en').format('LLL');

        const superGroupsSessions = chatSessions.filter((session) => session.payload.chatType === 'supergroup');
        const groupSessions = chatSessions.filter((session) => session.payload.chatType === 'group');
        const privateSessions = chatSessions.filter((session) => session.payload.chatType === 'private');
        const channelSessions = chatSessions.filter((session) => session.payload.chatType === 'channel');

        const totalSessionCount = chatSessions.length;
        const superGroupsCount = superGroupsSessions.length;
        const groupCount = groupSessions.length;
        const privateCount = privateSessions.length;
        const channelCount = channelSessions.length;

        const totalUserCounts = chatSessions
          .filter((session) => !session.payload.botRemoved)
          .reduce((accumulator, session) => accumulator + (session.payload.chatMembersCount || 1), 0);

        const adminsChatsCount = [...superGroupsSessions, ...groupSessions].filter((session) => session.payload.isBotAdmin).length;
        const memberChatsCount = [...superGroupsSessions, ...groupSessions].filter((session) => !session.payload.isBotAdmin).length;
        const botRemovedCount = [...superGroupsSessions, ...groupSessions].filter((session) => session.payload.botRemoved).length;

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
          enableDeleteDenylist: 0,
          enableWarnObscene: 0,
          enableAdminCheck: 0,
          enableDeleteChannelMessages: 0,
        };

        chatSessions
          .filter((session) => session.payload.chatSettings && session.payload.chatSettings.airRaidAlertSettings)
          .forEach((session) => {
            Object.keys(features).forEach((key) => {
              // eslint-disable-next-line security/detect-object-injection
              features[key] +=
                key === 'notificationMessage'
                  ? +session.payload.chatSettings.airRaidAlertSettings[key]
                  : +!!session.payload.chatSettings[key];
            });
          });

        await context.reply(
          getChatStatisticsMessage(context, {
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
          { parse_mode: 'HTML' },
        );

        await context.reply(
          getFeaturesStatisticsMessage(context, {
            features,
            chatsCount: adminsChatsCount,
          }),
          { parse_mode: 'HTML' },
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
        const writeContext = optimizeWriteContextUtility(context);
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
