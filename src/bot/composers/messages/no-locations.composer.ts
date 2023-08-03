import escapeHTML from 'escape-html';
import { Composer } from 'grammy';

import { LOGS_CHAT_THREAD_IDS } from '../../../const';
import { logsChat } from '../../../creator';
import { getDeleteFeatureMessage, locationLogsStartMessage } from '../../../message';
import type { GrammyContext } from '../../../types';
import { getEnabledFeaturesString, getUserData, telegramUtil } from '../../../utils';

/**
 * @description Remove message with any location
 * */
export const getNoLocationsComposer = () => {
  const noLocationsComposer = new Composer<GrammyContext>();

  /**
   * @param {GrammyContext} context
   * @param {string[]} locations
   * @param {string} [message]
   * */
  async function saveLocationMessage(context: GrammyContext, locations: string[], message?: string) {
    const { userMention, chatMention } = await telegramUtil.getLogsSaveMessageParts(context);
    const text = message || context.state?.text || '';

    return context.api.sendMessage(
      logsChat,
      `${locationLogsStartMessage} (${locations.join(', ')}) by user ${userMention}:\n\n${chatMention || userMention}\n${escapeHTML(text)}`,
      {
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.LOCATIONS,
      },
    );
  }

  noLocationsComposer.use(async (context, next) => {
    const { locations, text } = context.state;

    const isFeatureEnabled = context.chatSession.chatSettings.enableDeleteLocations;
    const areLocationsIncluded = locations && locations.length > 0;

    if (isFeatureEnabled && areLocationsIncluded) {
      await context.deleteMessage();

      const { writeUsername, userId } = getUserData(context);
      const featuresString = getEnabledFeaturesString(context.chatSession.chatSettings);
      await saveLocationMessage(context, locations, text);

      if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
        await context.replyWithSelfDestructedHTML(getDeleteFeatureMessage({ writeUsername, userId, featuresString }));
      }
    }

    return next();
  });

  return { noLocationsComposer };
};
