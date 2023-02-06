import { Composer } from 'grammy';

import { getDeleteRussianMessage } from '../../../message';
import type { GrammyContext } from '../../../types';
import { getUserData } from '../../../utils';

/**
 * @description Delete russian language messages
 * */
export const getNoRussianComposer = () => {
  const noRussianComposer = new Composer<GrammyContext>();

  noRussianComposer.use(async (context, next) => {
    const isFeatureEnabled = context.chatSession.chatSettings.enableDeleteRussian;
    const isRussianIncluded = context.state.isRussian;

    if (isFeatureEnabled && isRussianIncluded) {
      await context.deleteMessage();

      const { writeUsername, userId } = getUserData(context);
      await context.replyWithSelfDestructedHTML(getDeleteRussianMessage({ writeUsername, userId }));
    }

    return next();
  });

  return { noRussianComposer };
};
