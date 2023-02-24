import escapeHTML from 'escape-html';
import { Composer } from 'grammy';

import { LOGS_CHAT_THREAD_IDS } from '../../../const';
import { logsChat } from '../../../creator';
import { getDeleteRussianMessage } from '../../../message';
import type { DynamicStorageService } from '../../../services';
import type { GrammyContext } from '../../../types';
import { getRandomItem, getUserData, telegramUtil } from '../../../utils';

export interface NoRussianComposerProperties {
  dynamicStorageService: DynamicStorageService;
}

/**
 * @description Delete russian language messages
 * */
export const getNoRussianComposer = ({ dynamicStorageService }: NoRussianComposerProperties) => {
  const noRussianComposer = new Composer<GrammyContext>();

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
      `Deleted russian message (${(maxChance * 100).toFixed(2)}%) by user ${userMention}:\n\n${chatMention || userMention}\n${escapeHTML(
        text,
      )}`,
      {
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.ANTI_RUSSIAN,
      },
    );
  }

  noRussianComposer.use(async (context, next) => {
    const isFeatureEnabled = context.chatSession.chatSettings.enableDeleteRussian;
    const russianFeature = context.state.isRussian;

    if (isFeatureEnabled && russianFeature?.result) {
      await context.deleteMessage();
      await saveRussianMessage(context, russianFeature.percent, context.state.text);

      if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
        const { writeUsername, userId } = getUserData(context);
        await context.replyWithSelfDestructedHTML(
          getDeleteRussianMessage({ writeUsername, userId, message: getRandomItem(dynamicStorageService.ukrainianLanguageResponses) }),
        );
      }
    }

    return next();
  });

  return { noRussianComposer };
};
