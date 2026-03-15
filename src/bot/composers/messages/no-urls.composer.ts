import { Composer } from 'grammy';

import escapeHTML from 'escape-html';

import { logsChat } from '@bot/creator';

import { LOGS_CHAT_THREAD_IDS } from '@const/logs.const';

import { getDeleteFeatureMessage, urlLogsStartMessage } from '@message';

import type { GrammyContext } from '@app-types/context';

import { getEnabledFeaturesString, getUserData } from '@utils/generic.util';
import { telegramUtility } from '@utils/util-instances.util';

/**
 * @description Remove strategic information logic
 * */
export const getNoUrlsComposer = () => {
  const noUrlsComposer = new Composer<GrammyContext>();

  /**
   * Logs a deleted URL-containing message to the logs chat.
   * @param {GrammyContext} context
   * @param {string[]} urls
   * @param {string} [message]
   * */
  async function saveUrlsMessage(context: GrammyContext, urls: string[], message?: string) {
    const { userMention, chatMention } = await telegramUtility.getLogsSaveMessageParts(context);
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
        await context.replyWithSelfDestructedHTML(getDeleteFeatureMessage(context, { writeUsername, userId, featuresString }));
      }
    }

    return next();
  });

  return { noUrlsComposer };
};
