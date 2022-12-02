import { Composer, InlineKeyboard } from 'grammy';

import { getReportCommandMessage, getReportHelpCommandMessage, reportHelpAgreeMessage } from '../../message';
import type { GrammyContext } from '../../types';
import { getUserData } from '../../utils';
import { isCallbackFromAuthorFilter } from '../filters';
import { removeCallbackMessagesMiddleware } from '../middleware';

/**
 * @description Message handling composer
 * */
export const getReportComposer = () => {
  const reportComposer = new Composer<GrammyContext>();
  const reportNonRepliedQueryTrigger = 'confirmNonReplied';

  const repliedReportComposer = reportComposer.command('report').filter((context) => !!context.msg.reply_to_message);
  const nonRepliedReportComposer = reportComposer.command('report').filter((context) => !context.msg.reply_to_message);

  /**
   * No reply logic
   * */
  nonRepliedReportComposer.use(async (context, next) => {
    const inlineKeyboard = new InlineKeyboard().text(reportHelpAgreeMessage, reportNonRepliedQueryTrigger);

    const { writeUsername, userId } = getUserData(context);

    await context.replyWithHTML(getReportHelpCommandMessage({ writeUsername, userId, botName: context.me.username }), {
      reply_to_message_id: context.msg.message_id,
      reply_markup: inlineKeyboard,
    });

    return next();
  });

  reportComposer
    .callbackQuery(reportNonRepliedQueryTrigger)
    .filter((context) => isCallbackFromAuthorFilter(context))
    .use(removeCallbackMessagesMiddleware);

  /**
   * Replied message logic
   * */
  repliedReportComposer.use(async (context) => {
    const { writeUsername, userId } = getUserData(context);

    // TODO add protection for not admin otherwise it will throw an error
    await context.deleteMessage();
    await context.replyWithHTML(getReportCommandMessage({ writeUsername, userId }), {
      reply_to_message_id: context.msg.reply_to_message!.message_id,
    });
  });

  return { reportComposer };
};
