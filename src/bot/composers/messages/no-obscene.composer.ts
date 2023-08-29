import escapeHTML from 'escape-html';
import { Composer } from 'grammy';

import { LOGS_CHAT_THREAD_IDS } from '../../../const';
import { logsChat } from '../../../creator';
import { getDeleteObsceneMessage, obsceneDeleteLogsStartMessage } from '../../../message';
import { obsceneService } from '../../../services';
import type { GrammyContext } from '../../../types';
import type { SearchSetResult } from '../../../utils';
import { censorWord, getUserData, telegramUtil } from '../../../utils';

/**
 * @description Remove strategic information logic
 * */
export const getNoObsceneComposer = () => {
  const noObsceneComposer = new Composer<GrammyContext>();

  /**
   * @param {GrammyContext} context
   * @param {SearchSetResult} searchResult
   * */
  async function saveObsceneMessage(context: GrammyContext, searchResult: SearchSetResult) {
    const { userMention, chatMention } = await telegramUtil.getLogsSaveMessageParts(context);
    const text = context.state?.text || '';

    return context.api.sendMessage(
      logsChat,
      `${obsceneDeleteLogsStartMessage} due to word "${searchResult.origin}" by "${searchResult.found}" origin at ${
        searchResult.wordIndex
      } word index by user ${userMention}:\n\n${chatMention || userMention}\n${escapeHTML(text)}`,
      {
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.OBSCENE,
      },
    );
  }

  noObsceneComposer.use(async (context, next) => {
    const isFeatureEnabled = context.chatSession.chatSettings.enableDeleteObscene;
    const isObscene = obsceneService.checkObscene(context.state.text || '');

    if (isFeatureEnabled && isObscene) {
      await context.deleteMessage();
      await saveObsceneMessage(context, isObscene);

      const { writeUsername, userId } = getUserData(context);

      if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
        await context.replyWithSelfDestructedHTML(getDeleteObsceneMessage({ writeUsername, userId, word: censorWord(isObscene.origin) }));
      }
    }

    return next();
  });

  return { noObsceneComposer };
};
