import { Composer } from 'grammy';

import escapeHTML from 'escape-html';

import { logsChat } from '@bot/creator';

import { LOGS_CHAT_THREAD_IDS } from '@const/logs.const';

import { channelMessageLogsStartMessage, getDeleteFeatureMessage } from '@message';

import type { GrammyContext } from '@app-types/context';

import { getEnabledFeaturesString, getUserData } from '@utils/generic.util';
import { telegramUtility } from '@utils/util-instances.util';

const CHANNEL_BOT_ID = 136_817_688;

/**
 * Returns a composer that detects and deletes messages posted by channels in comment sections.
 * @returns Object containing the no-channel-messages composer instance.
 */
export const getNoChannelMessagesComposer = () => {
  const noChannelMessagesComposer = new Composer<GrammyContext>();

  /**
   * Logs a deleted channel message to the logs chat.
   * @param context - The Grammy context of the incoming message.
   * @param [parentChannelId] - The ID of the parent channel the message is a reply from.
   * @param [senderChatId] - The ID of the channel that sent the message.
   * @param [message] - Optional message text override.
   * @returns Promise resolving to the sent log message.
   */
  async function saveChannelMessage(context: GrammyContext, parentChannelId?: number, senderChatId?: number, message?: string) {
    const { userMention, chatMention } = await telegramUtility.getLogsSaveMessageParts(context);
    const text = message || context.state?.text || '';

    return context.api.sendMessage(
      logsChat,
      `${channelMessageLogsStartMessage} (${parentChannelId}) by sender channel (${senderChatId}) ${userMention}:\n\n${
        chatMention || userMention
      }\n${escapeHTML(text)}`,
      {
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.CHANNEL_MESSAGES,
      },
    );
  }

  noChannelMessagesComposer.use(async (context, next) => {
    const fromId = context.from?.id;
    const isFeatureEnabled = context.chatSession.chatSettings.enableDeleteChannelMessages;
    const senderChatId = context.senderChat?.id;
    const parentChannelId = context.msg?.reply_to_message?.sender_chat?.id;

    /**
     * For public channels Telegram could send the message from channel as Channel_Bot.
     * It means an admin wrote the message, so we need to skip it.
     * UPDATED: Channel admins use GroupAnonymousBot identifier
     * https://github.com/42wim/matterbridge/issues/1654
     */
    const isChannel = fromId === CHANNEL_BOT_ID || context.from?.username === 'Channel_Bot';

    if (isFeatureEnabled && isChannel) {
      if (senderChatId === parentChannelId) {
        return next();
      }

      const { text } = context.state;

      await context.deleteMessage();

      const { writeUsername, userId } = getUserData(context);
      const featuresString = getEnabledFeaturesString(context.chatSession.chatSettings);

      await saveChannelMessage(context, parentChannelId, senderChatId, text);

      if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
        await context.replyWithSelfDestructedHTML(getDeleteFeatureMessage(context, { writeUsername, userId, featuresString }));
      }
    }

    return next();
  });

  return { noChannelMessagesComposer };
};
