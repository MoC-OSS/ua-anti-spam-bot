import escapeHTML from 'escape-html';
import { Composer } from 'grammy';

import { LOGS_CHAT_THREAD_IDS } from '../../../const';
import { logsChat } from '../../../creator';
import { getDeleteNsfwMessage, nsfwLogsStartMessage } from '../../../message';
import type { NsfwDetectService } from '../../../services/nsfw-detect.service';
import type { GrammyContext } from '../../../types';
import { getUserData, telegramUtil } from '../../../utils';

export interface NsfwMessageFilterComposerProperties {
  nsfwDetectService: NsfwDetectService;
}

/**
 * @description Delete russian language messages
 * */
export const getNsfwMessageFilterComposer = ({ nsfwDetectService }: NsfwMessageFilterComposerProperties) => {
  const nsfwMessageFilterComposer = new Composer<GrammyContext>();

  /**
   * @param {GrammyContext} context
   * @param {number} maxChance
   * @param {string} [message]
   * */
  async function saveNsfwMessage(context: GrammyContext, maxChance: number, message?: string) {
    const { userMention, chatMention } = await telegramUtil.getLogsSaveMessageParts(context);
    const text = message || context.state?.text || '';

    return context.api.sendMessage(
      logsChat,
      `${nsfwLogsStartMessage} (${(maxChance * 100).toFixed(2)}%) by user ${userMention}:\n\n${chatMention || userMention}\n${escapeHTML(
        text,
      )}`,
      {
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.CHANNEL_MESSAGES, // TODO change to PORN
      },
    );
  }

  nsfwMessageFilterComposer.use(async (context, next) => {
    const isFeatureEnabled = !context.chatSession.chatSettings.disableNsfwFilter;
    const nsfwResult = nsfwDetectService.processMessage(context.state.text || '');

    if (nsfwResult) {
      context.state.nsfwResult = {
        result: nsfwResult,
        reason: 'message',
      };
    }

    if (isFeatureEnabled && nsfwResult) {
      await context.deleteMessage();
      await saveNsfwMessage(context, nsfwResult.rate, context.state.text);

      if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
        const { writeUsername, userId } = getUserData(context);
        await context.replyWithSelfDestructedHTML(getDeleteNsfwMessage({ writeUsername, userId }));
      }
    }

    return next();
  });

  return { nsfwMessageFilterComposer };
};
