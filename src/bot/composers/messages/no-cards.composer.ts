import { Composer } from 'grammy';

import escapeHTML from 'escape-html';

import { logsChat } from '@bot/creator';

import { LOGS_CHAT_THREAD_IDS } from '@const/logs.const';

import { cardLogsStartMessage, getDeleteFeatureMessage } from '@message';

import type { GrammyContext } from '@app-types/context';

import { getEnabledFeaturesString, getUserData } from '@utils/generic.util';
import { telegramUtility } from '@utils/util-instances.util';

/**
 * Returns a composer that detects and deletes messages containing card numbers.
 * @returns Object containing the no-cards composer instance.
 */
export const getNoCardsComposer = () => {
  const noCardsComposer = new Composer<GrammyContext>();

  /**
   * Logs a deleted card-containing message to the logs chat.
   * @param context - The Grammy context of the incoming message.
   * @param cards - List of card numbers detected in the message.
   * @param [message] - Optional message text override.
   * @returns Promise resolving to the sent log message.
   */
  async function saveCardMessage(context: GrammyContext, cards: string[], message?: string) {
    const { userMention, chatMention } = await telegramUtility.getLogsSaveMessageParts(context);
    const text = message || context.state?.text || '';

    return context.api.sendMessage(
      logsChat,
      `${cardLogsStartMessage} (${cards.join(', ')}) by user ${userMention}:\n\n${chatMention || userMention}\n${escapeHTML(text)}`,
      {
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.CARDS,
      },
    );
  }

  noCardsComposer.use(async (context, next) => {
    const { cards, text } = context.state;
    const isFeatureEnabled = context.chatSession.chatSettings.enableDeleteCards;
    const areCardsIncluded = cards && cards.length > 0;

    if (isFeatureEnabled && areCardsIncluded) {
      await context.deleteMessage();

      const { writeUsername, userId } = getUserData(context);
      const featuresString = getEnabledFeaturesString(context.chatSession.chatSettings);

      await saveCardMessage(context, cards, text);

      if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
        await context.replyWithSelfDestructedHTML(getDeleteFeatureMessage(context, { writeUsername, userId, featuresString }));
      }
    }

    return next();
  });

  return { noCardsComposer };
};
