import escapeHTML from 'escape-html';
import { Composer } from 'grammy';

import { LOGS_CHAT_THREAD_IDS } from '../../../const';
import { logsChat } from '../../../creator';
import { urlLogsStartMessage } from '../../../message';
import { getDeleteDenylistMessage } from '../../../message/denylist.message';
import type { GrammyContext } from '../../../types';
import { getUserData, telegramUtil } from '../../../utils';

/**
 * @description Remove strategic information logic
 */
export const getDenylistComposer = () => {
  const denylistComposer = new Composer<GrammyContext>();

  /**
   * @param {GrammyContext} context
   * @param {string} [message]
   * */
  async function logDenylistMessage(context: GrammyContext, message?: string) {
    const { userMention, chatMention } = await telegramUtil.getLogsSaveMessageParts(context);
    const text = message || context.state?.text || '';
    const { denylist } = context.chatSession.chatSettings;
    return context.api.sendMessage(
      logsChat,
      `${urlLogsStartMessage} (${denylist?.join(', ')}) by user ${userMention}:\n\n${chatMention || userMention}\n${escapeHTML(text)}`,
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
          await context.replyWithSelfDestructedHTML(getDeleteDenylistMessage({ writeUsername, userId, word: denyWord }));
        }
      }
    }
    return next();
  });

  return { denylistComposer };
};
