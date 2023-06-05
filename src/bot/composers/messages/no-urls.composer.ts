import escapeHTML from 'escape-html';
import { Composer } from 'grammy';

import { LOGS_CHAT_THREAD_IDS } from '../../../const';
import { logsChat } from '../../../creator';
import { getDeleteFeatureMessage, urlLogsStartMessage } from '../../../message';
import type { GrammyContext } from '../../../types';
import { getEnabledFeaturesString, getUserData, telegramUtil } from '../../../utils';

/**
 * @description Remove strategic information logic
 * */
export const getNoUrlsComposer = () => {
  const noUrlsComposer = new Composer<GrammyContext>();

  /**
   * @param {GrammyContext} context
   * @param {string[]} urls
   * @param {string} [message]
   * */
  async function saveUrlsMessage(context: GrammyContext, urls: string[], message?: string) {
    const { userMention, chatMention } = await telegramUtil.getLogsSaveMessageParts(context);
    const text = message || context.state?.text || '';

    return context.api.sendMessage(
      logsChat,
      `${urlLogsStartMessage} (${urls.join(', ')}) by user ${userMention}:\n\n${chatMention || userMention}\n${escapeHTML(text)}`,
      {
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.URLS,
      },
    );
  }

  noUrlsComposer.use(async (context, next) => {
    const { urls, text } = context.state;
    const isFeatureEnabled = context.chatSession.chatSettings.enableDeleteUrls;
    const areUrlsIncluded = urls && urls.length > 0;

    if (isFeatureEnabled && areUrlsIncluded) {
      await context.deleteMessage();

      const { writeUsername, userId } = getUserData(context);
      const featuresString = getEnabledFeaturesString(context.chatSession.chatSettings);
      await saveUrlsMessage(context, urls, text);

      if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
        await context.replyWithSelfDestructedHTML(getDeleteFeatureMessage({ writeUsername, userId, featuresString }));
      }
    }

    return next();
  });

  return { noUrlsComposer };
};
