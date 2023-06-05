import escapeHTML from 'escape-html';
import { Composer } from 'grammy';

import { LOGS_CHAT_THREAD_IDS } from '../../../const';
import { logsChat } from '../../../creator';
import { cardLogsStartMessage, getDeleteFeatureMessage } from '../../../message';
import type { GrammyContext } from '../../../types';
import { getEnabledFeaturesString, getUserData, telegramUtil } from '../../../utils';

/**
 * @description Remove strategic information logic
 * */
export const getNoCardsComposer = () => {
  const noCardsComposer = new Composer<GrammyContext>();

  /**
   * @param {GrammyContext} context
   * @param {string[]} cards
   * @param {string} [message]
   * */
  async function saveCardMessage(context: GrammyContext, cards: string[], message?: string) {
    const { userMention, chatMention } = await telegramUtil.getLogsSaveMessageParts(context);
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
        await context.replyWithSelfDestructedHTML(getDeleteFeatureMessage({ writeUsername, userId, featuresString }));
      }
    }

    return next();
  });

  return { noCardsComposer };
};
