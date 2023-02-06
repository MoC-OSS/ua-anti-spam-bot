import { Composer } from 'grammy';

import { getWarnRussianMessage } from '../../../message';
import type { GrammyContext } from '../../../types';

/**
 * @description Warn users that the chat is only for ukrainians
 * */
export const getWarnRussianComposer = () => {
  const warnRussianComposer = new Composer<GrammyContext>();

  warnRussianComposer.use(async (context, next) => {
    const isFeatureEnabled = context.chatSession.chatSettings.enableWarnRussian;
    const isRussianIncluded = context.state.isRussian;

    if (isFeatureEnabled && isRussianIncluded) {
      await context.replyWithSelfDestructedHTML(getWarnRussianMessage(), { reply_to_message_id: context.msg?.message_id });
    }

    return next();
  });

  return { warnRussianComposer };
};
