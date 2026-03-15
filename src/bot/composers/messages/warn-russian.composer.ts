import { Composer } from 'grammy';

import escapeHTML from 'escape-html';

import { LOGS_CHAT_THREAD_IDS } from '@const/logs.const';

import { getUkrainianMessageExtra, getWarnRussianMessage, russianWarnLogsStartMessage } from '@message';

import type { DynamicStorageService } from '@services/dynamic-storage.service';

import type { GrammyContext } from '@app-types/context';

import { getRandomItem } from '@utils/generic.util';
import { telegramUtility } from '@utils/util-instances.util';

import { logsChat } from '../../../creator';

/** Properties for the warn-Russian language composer. */
export interface WarnRussianComposerProperties {
  dynamicStorageService: DynamicStorageService;
}

/**
 * @description Warn users that the chat is only for ukrainians
 * */
export const getWarnRussianComposer = ({ dynamicStorageService }: WarnRussianComposerProperties) => {
  const warnRussianComposer = new Composer<GrammyContext>();

  /**
   * Logs a warned Russian-language message to the logs chat.
   * @param {GrammyContext} context
   * @param {number} maxChance
   * @param {string} [message]
   * */
  async function saveRussianMessage(context: GrammyContext, maxChance: number, message?: string) {
    const { userMention, chatMention } = await telegramUtility.getLogsSaveMessageParts(context);
    const text = message || context.state?.text || '';

    return context.api.sendMessage(
      logsChat,
      `${russianWarnLogsStartMessage} (${(maxChance * 100).toFixed(2)}%) by user ${userMention}:\n\n${
        chatMention || userMention
      }\n${escapeHTML(text)}`,
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

      await context.replyWithSelfDestructedHTML(
        getWarnRussianMessage(getRandomItem(dynamicStorageService.ukrainianLanguageResponses)) +
          getUkrainianMessageExtra(russianFeature.percent),
        {
          reply_to_message_id: context.msg?.message_id,
        },
      );
    }

    return next();
  });

  return { warnRussianComposer };
};
