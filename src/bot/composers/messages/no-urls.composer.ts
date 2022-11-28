import { Composer } from 'grammy';

import type { GrammyContext } from '../../../types';

/**
 * @description Remove strategic information logic
 * */
export const getNoUrlsComposer = () => {
  const noUrlsComposer = new Composer<GrammyContext>();

  noUrlsComposer.use(async (context, next) => {
    const isFeatureEnabled = context.chatSession.chatSettings.enableDeleteUrls;
    const areUrlsIncluded = context.state.urls && context.state.urls.length > 0;

    if (isFeatureEnabled && areUrlsIncluded) {
      await context.deleteMessage();
      context.state.isDeleted = true;
    }

    return next();
  });

  return { noUrlsComposer };
};
