import { Composer } from 'grammy';

import escapeHTML from 'escape-html';

import { LOGS_CHAT_THREAD_IDS } from '@const/logs.const';

import { getDeleteRussianMessage, getUkrainianMessageExtra, russianDeleteLogsStartMessage } from '@message';

import type { DynamicStorageService } from '@services/dynamic-storage.service';

import type { GrammyContext } from '@app-types/context';

import { getRandomItem, getUserData } from '@utils/generic.util';
import { telegramUtility } from '@utils/util-instances.util';

import { logsChat } from '../../../creator';

/** Properties for the no-Russian language composer. */
export interface NoRussianComposerProperties {
  dynamicStorageService: DynamicStorageService;
}

/**
 * @description Delete russian language messages
 * */
export const getNoRussianComposer = ({ dynamicStorageService }: NoRussianComposerProperties) => {
  const noRussianComposer = new Composer<GrammyContext>();

  /**
   * Logs a deleted Russian-language message to the logs chat.
   * @param {GrammyContext} context
   * @param {number} maxChance
   * @param {string} [message]
   * */
  async function saveRussianMessage(context: GrammyContext, maxChance: number, message?: string) {
    const { userMention, chatMention } = await telegramUtility.getLogsSaveMessageParts(context);
    const text = message || context.state?.text || '';

    return context.api.sendMessage(
      logsChat,
      `${russianDeleteLogsStartMessage} (${(maxChance * 100).toFixed(2)}%) by user ${userMention}:\n\n${
        chatMention || userMention
      }\n${escapeHTML(text)}`,
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
          getDeleteRussianMessage(context, {
            writeUsername,
            userId,
            message: getRandomItem(dynamicStorageService.ukrainianLanguageResponses),
          }) + getUkrainianMessageExtra(russianFeature.percent),
        );
      }
    }

    return next();
  });

  return { noRussianComposer };
};
