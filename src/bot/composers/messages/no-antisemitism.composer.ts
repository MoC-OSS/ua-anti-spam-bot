import escapeHTML from 'escape-html';
import { Composer } from 'grammy';

import { LOGS_CHAT_THREAD_IDS } from '../../../const';
import { logsChat } from '../../../creator';
import { antisemitismDeleteLogsStartMessage, getDeleteAntisemitismMessage } from '../../../message';
import { antisemitismService } from '../../../services/antisemitism.service';
import type { GrammyContext } from '../../../types';
import type { SearchSetResult } from '../../../utils';
import { censorWord, getUserData, telegramUtil } from '../../../utils';

/**
 * @description Delete antisemitism language messages
 * */
export const getNoAntisemitismComposer = () => {
  const noAntisemitismComposer = new Composer<GrammyContext>();

  /**
   * @param {GrammyContext} context
   * @param {SearchSetResult} searchResult
   * */
  async function saveAntisemitismMessage(context: GrammyContext, searchResult: SearchSetResult) {
    const { userMention, chatMention } = await telegramUtil.getLogsSaveMessageParts(context);
    const text = context.state?.text || '';

    return context.api.sendMessage(
      logsChat,
      `${antisemitismDeleteLogsStartMessage} due to word "${searchResult.origin}" by "${searchResult.found}" origin at ${
        searchResult.wordIndex
      } word index by user ${userMention}:\n\n${chatMention || userMention}\n${escapeHTML(text)}`,
      {
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.ANTISEMITISM,
      },
    );
  }

  noAntisemitismComposer.use(async (context, next) => {
    const isFeatureEnabled = !context.chatSession.chatSettings.disableDeleteAntisemitism;
    const isAntisemitism = antisemitismService.checkAntisemitism(context.state.text || '');

    if (isFeatureEnabled && isAntisemitism) {
      await context.deleteMessage();
      await saveAntisemitismMessage(context, isAntisemitism);

      const { writeUsername, userId } = getUserData(context);

      if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
        await context.replyWithSelfDestructedHTML(
          getDeleteAntisemitismMessage({ writeUsername, userId, word: censorWord(isAntisemitism.origin) }),
        );
      }
    }

    return next();
  });

  return { noAntisemitismComposer };
};
