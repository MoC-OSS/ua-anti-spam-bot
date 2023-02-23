import escapeHTML from 'escape-html';
import { Composer } from 'grammy';

import { LOGS_CHAT_THREAD_IDS } from '../../../const';
import { logsChat } from '../../../creator';
import { getWarnRussianMessage } from '../../../message';
import type { DynamicStorageService } from '../../../services';
import type { GrammyContext } from '../../../types';
import { getRandomItem, telegramUtil } from '../../../utils';

export interface WarnRussianComposerProperties {
  dynamicStorageService: DynamicStorageService;
}

/**
 * @description Warn users that the chat is only for ukrainians
 * */
export const getWarnRussianComposer = ({ dynamicStorageService }: WarnRussianComposerProperties) => {
  const warnRussianComposer = new Composer<GrammyContext>();

  /**
   * @param {GrammyContext} context
   * @param {number} maxChance
   * @param {string} [message]
   * */
  async function saveRussianMessage(context: GrammyContext, maxChance: number, message?: string) {
    const { userMention, chatMention } = await telegramUtil.getLogsSaveMessageParts(context);
    const text = message || context.state?.text || '';

    return context.api.sendMessage(
      logsChat,
      `Warn russian message (${maxChance.toFixed(2)}%) by user ${userMention}:\n\n${chatMention || userMention}\n${escapeHTML(text)}`,
      {
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.ANTI_RUSSIAN,
      },
    );
  }

  warnRussianComposer.use(async (context, next) => {
    const isFeatureEnabled = context.chatSession.chatSettings.enableWarnRussian;
    const russianFeature = context.state.isRussian;

    if (isFeatureEnabled && russianFeature?.result) {
      await saveRussianMessage(context, russianFeature.percent, context.state.text);

      await context.replyWithSelfDestructedHTML(getWarnRussianMessage(getRandomItem(dynamicStorageService.ukrainianLanguageResponses)), {
        reply_to_message_id: context.msg?.message_id,
      });
    }

    return next();
  });

  return { warnRussianComposer };
};
