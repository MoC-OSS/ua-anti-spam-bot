import { Composer } from 'grammy';

import { getDeleteFeatureMessage } from '../../../message';
import type { GrammyContext } from '../../../types';
import { getEnabledFeaturesString, getUserData } from '../../../utils';

const CHANNEL_BOT_ID = 136_817_688;

/**
 * @description Remove messages that has been left by channels in a comments
 * */
export const getNoChannelMessagesComposer = () => {
  const noChannelMessagesComposer = new Composer<GrammyContext>();

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
     * */
    const isChannel = fromId === CHANNEL_BOT_ID || context.from?.username === 'Channel_Bot';

    if (isFeatureEnabled && isChannel) {
      if (senderChatId === parentChannelId) {
        return next();
      }

      await context.deleteMessage();

      const { writeUsername, userId } = getUserData(context);
      const featuresString = getEnabledFeaturesString(context.chatSession.chatSettings);

      if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
        await context.replyWithSelfDestructedHTML(getDeleteFeatureMessage({ writeUsername, userId, featuresString }));
      }
    }

    return next();
  });

  return { noChannelMessagesComposer };
};
