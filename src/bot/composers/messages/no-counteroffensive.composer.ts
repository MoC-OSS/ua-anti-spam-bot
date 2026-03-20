import { Composer } from 'grammy';

import escapeHTML from 'escape-html';

import { logsChat } from '@bot/creator';

import { LOGS_CHAT_THREAD_IDS } from '@const/logs.const';

import { counteroffensiveLogsStartMessage, getDeleteCounteroffensiveMessage } from '@message';

import type { GrammyContext } from '@app-types/context';

import { getUserData } from '@utils/generic.util';
import { telegramUtility } from '@utils/util-instances.util';

/**
 * Returns a composer that detects and deletes messages containing counteroffensive information.
 * @returns Object containing the no-counteroffensive composer instance.
 */
export const getNoCounterOffensiveComposer = () => {
  const noCounterOffensiveComposer = new Composer<GrammyContext>();

  /**
   * Logs a deleted counteroffensive message to the logs chat.
   * @param context - The Grammy context of the incoming message.
   * @param reason - The regex pattern or string that matched counteroffensive content.
   * @param maxChance - The detection confidence score (0–1).
   * @param [message] - Optional message text override.
   * @returns Promise resolving to the sent log message.
   */
  async function saveCounteroffensiveMessage(context: GrammyContext, reason: RegExp | string, maxChance: number, message?: string) {
    const { userMention, chatMention } = await telegramUtility.getLogsSaveMessageParts(context);
    const text = message || context.state?.text || '';

    return context.api.sendMessage(
      logsChat,
      `${counteroffensiveLogsStartMessage} ${reason instanceof RegExp ? 'regex' : 'string'} '${reason.toString()}' reason (${(
        maxChance * 100
      ).toFixed(2)}%) by user ${userMention}:\n\n${chatMention || userMention}\n${escapeHTML(text)}`,
      {
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.COUNTEROFFENSIVE,
      },
    );
  }

  noCounterOffensiveComposer.use(async (context, next) => {
    const isFeatureEnabled = context.chatSession.chatSettings.enableDeleteCounteroffensive;
    const { isCounterOffensive, text } = context.state;

    if (isFeatureEnabled && isCounterOffensive?.result) {
      const { reason, percent } = isCounterOffensive;

      await context.deleteMessage();
      await saveCounteroffensiveMessage(context, reason, percent, text);

      const { writeUsername, userId } = getUserData(context);

      if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
        await context.replyWithSelfDestructedHTML(getDeleteCounteroffensiveMessage(context, { writeUsername, userId }));
      }
    }

    return next();
  });

  return { noCounterOffensiveComposer };
};
