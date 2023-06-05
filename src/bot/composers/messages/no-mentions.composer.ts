import escapeHTML from 'escape-html';
import { Composer } from 'grammy';

import { LOGS_CHAT_THREAD_IDS } from '../../../const';
import { logsChat } from '../../../creator';
import { getDeleteFeatureMessage, mentionLogsStartMessage } from '../../../message';
import type { GrammyContext } from '../../../types';
import { getEnabledFeaturesString, getUserData, telegramUtil } from '../../../utils';

/**
 * @description Remove strategic information logic
 * */
export const getNoMentionsComposer = () => {
  const noMentionsComposer = new Composer<GrammyContext>();

  /**
   * @param {GrammyContext} context
   * @param {string[]} mentions
   * @param {string} [message]
   * */
  async function saveMentionsMessage(context: GrammyContext, mentions: string[], message?: string) {
    const { userMention, chatMention } = await telegramUtil.getLogsSaveMessageParts(context);
    const text = message || context.state?.text || '';

    return context.api.sendMessage(
      logsChat,
      `${mentionLogsStartMessage} (${mentions.join(', ')}) by user ${userMention}:\n\n${chatMention || userMention}\n${escapeHTML(text)}`,
      {
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.MENTIONS,
      },
    );
  }

  noMentionsComposer.use(async (context, next) => {
    const { mentions, text } = context.state;
    const isFeatureEnabled = context.chatSession.chatSettings.enableDeleteMentions;
    const areMentionsIncluded = mentions && mentions.length > 0;

    if (isFeatureEnabled && areMentionsIncluded) {
      await context.deleteMessage();

      const { writeUsername, userId } = getUserData(context);
      const featuresString = getEnabledFeaturesString(context.chatSession.chatSettings);
      await saveMentionsMessage(context, mentions, text);

      if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
        await context.replyWithSelfDestructedHTML(getDeleteFeatureMessage({ writeUsername, userId, featuresString }));
      }
    }

    return next();
  });

  return { noMentionsComposer };
};
