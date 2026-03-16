import { Composer } from 'grammy';

import escapeHTML from 'escape-html';

import { logsChat } from '@bot/creator';

import { LOGS_CHAT_THREAD_IDS } from '@const/logs.const';

import { obsceneWarnLogsStartMessage } from '@message';
import { getWarnObsceneMessage } from '@message/obscene.message';

import { obsceneService } from '@services/obscene.service';

import type { GrammyContext } from '@app-types/context';

import type { SearchSetResult } from '@utils/search-set.util';
import { telegramUtility } from '@utils/util-instances.util';

/**
 * @description Remove strategic information logic
 */
export const getWarnObsceneComposer = () => {
  const warnObsceneComposer = new Composer<GrammyContext>();

  /**
   * Logs a warned obscene message to the logs chat.
   * @param context
   * @param searchResult
   */
  async function saveObsceneMessage(context: GrammyContext, searchResult: SearchSetResult) {
    const { userMention, chatMention } = await telegramUtility.getLogsSaveMessageParts(context);
    const text = context.state?.text || '';

    return context.api.sendMessage(
      logsChat,
      `${obsceneWarnLogsStartMessage} due to word "${searchResult.origin}" by "${searchResult.found}" origin at ${
        searchResult.wordIndex
      } word index by user ${userMention}:\n\n${chatMention || userMention}\n${escapeHTML(text)}`,
      {
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.OBSCENE,
      },
    );
  }

  warnObsceneComposer.use(async (context, next) => {
    const isFeatureEnabled = context.chatSession.chatSettings.enableWarnObscene;
    const isObscene = obsceneService.checkObscene(context.state.text || '');

    if (isFeatureEnabled && isObscene) {
      await saveObsceneMessage(context, isObscene);

      await context.replyWithSelfDestructedHTML(getWarnObsceneMessage(context), {
        reply_to_message_id: context.msg?.message_id,
      });
    }

    return next();
  });

  return { warnObsceneComposer };
};
