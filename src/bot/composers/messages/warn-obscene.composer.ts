import escapeHTML from 'escape-html';
import { Composer } from 'grammy';

import { LOGS_CHAT_THREAD_IDS } from '../../../const';
import { logsChat } from '../../../creator';
import { getWarnObsceneMessage, obsceneWarnLogsStartMessage } from '../../../message';
import { obsceneService } from '../../../services';
import type { GrammyContext } from '../../../types';
import type { SearchSetResult } from '../../../utils';
import { telegramUtil } from '../../../utils';

/**
 * @description Remove strategic information logic
 * */
export const getWarnObsceneComposer = () => {
  const warnObsceneComposer = new Composer<GrammyContext>();

  /**
   * @param {GrammyContext} context
   * @param {SearchSetResult} searchResult
   * */
  async function saveObsceneMessage(context: GrammyContext, searchResult: SearchSetResult) {
    const { userMention, chatMention } = await telegramUtil.getLogsSaveMessageParts(context);
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

      if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
        await context.replyWithSelfDestructedHTML(getWarnObsceneMessage(), {
          reply_to_message_id: context.msg?.message_id,
        });
      }
    }

    return next();
  });

  return { warnObsceneComposer };
};
