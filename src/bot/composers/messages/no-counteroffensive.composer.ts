import escapeHTML from 'escape-html';
import { Composer } from 'grammy';

import { LOGS_CHAT_THREAD_IDS } from '../../../const';
import { logsChat } from '../../../creator';
import { getDeleteCounteroffensiveMessage } from '../../../message';
import type { GrammyContext } from '../../../types';
import { getUserData, telegramUtil } from '../../../utils';

/**
 * @description Remove messages which includes counteroffensive information
 * */
export const getNoCounterOffensiveComposer = () => {
  const noCounterOffensiveComposer = new Composer<GrammyContext>();

  /**
   * @param {GrammyContext} context
   * @param {string | RegExp} reason
   * @param {number} maxChance
   * @param {string} [message]
   * */
  async function saveCounteroffensiveMessage(context: GrammyContext, reason: string | RegExp, maxChance: number, message?: string) {
    const { userMention, chatMention } = await telegramUtil.getLogsSaveMessageParts(context);
    const text = message || context.state?.text || '';

    return context.api.sendMessage(
      logsChat,
      `Deleted counteroffensive message by ${reason instanceof RegExp ? 'regex' : 'string'} '${reason.toString()}' reason (${(
        maxChance * 100
      ).toFixed(2)}%) by user ${userMention}:\n\n${chatMention || userMention}\n${escapeHTML(text)}`,
      {
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.COUNTEROFFENSIVE,
      },
    );
  }

  noCounterOffensiveComposer.use(async (context, next) => {
    const { isCounterOffensive, text } = context.state;

    if (isCounterOffensive?.result) {
      const { reason, percent } = isCounterOffensive;
      await context.deleteMessage();
      await saveCounteroffensiveMessage(context, reason, percent, text);

      const { writeUsername, userId } = getUserData(context);

      if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
        await context.replyWithSelfDestructedHTML(getDeleteCounteroffensiveMessage({ writeUsername, userId }));
      }
    }

    return next();
  });

  return { noCounterOffensiveComposer };
};
