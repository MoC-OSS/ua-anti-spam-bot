import { Composer } from 'grammy';

import escapeHTML from 'escape-html';

import { logsChat } from '@bot/creator';

import { LOGS_CHAT_THREAD_IDS } from '@const/logs.const';

import { urlLogsStartMessage } from '@message';
import { getDeleteDenylistMessage } from '@message/denylist.message';

import type { GrammyContext } from '@app-types/context';

import { getUserData } from '@utils/generic.util';
import { telegramUtility } from '@utils/util-instances.util';

/**
 * @description Remove strategic information logic
 */
export const getDenylistComposer = () => {
  const denylistComposer = new Composer<GrammyContext>();

  /**
   * Logs a denylist violation message to the logs chat.
   * @param context
   * @param [message]
   * @param denyWord
   */
  async function logDenylistMessage(context: GrammyContext, denyWord: string) {
    const { userMention, chatMention } = await telegramUtility.getLogsSaveMessageParts(context);
    const fullText = context.state?.text || '';

    return context.api.sendMessage(
      logsChat,
      `${urlLogsStartMessage} (word: "${escapeHTML(denyWord)}") by user ${userMention}:\n\n${chatMention || userMention}\n${escapeHTML(
        fullText,
      )}`,
      {
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.DENYLIST,
      },
    );
  }

  /**
   * Middleware to handle denylist checks and message deletion.
   */
  denylistComposer.use(async (context, next) => {
    const { text } = context.state;
    const { chatSettings } = context.chatSession;
    const { denylist, enableDeleteDenylist } = chatSettings;

    if (Array.isArray(denylist) && denylist.length > 0 && text && enableDeleteDenylist) {
      const denyWord = denylist.find((word) => text.toLowerCase().includes(word.toLowerCase()));

      if (denyWord) {
        await context.deleteMessage();
        await logDenylistMessage(context, denyWord);

        if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
          const { writeUsername, userId } = getUserData(context);

          await context.replyWithSelfDestructedHTML(getDeleteDenylistMessage(context, { writeUsername, userId, word: denyWord }));
        }
      }
    }

    return next();
  });

  return { denylistComposer };
};
