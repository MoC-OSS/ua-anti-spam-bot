import { Composer } from 'grammy';

import { getDeleteFeatureMessage } from '../../../message';
import type { GrammyContext } from '../../../types';
import { getEnabledFeaturesString, getUserData } from '../../../utils';

/**
 * @description Remove strategic information logic
 * */
export const getNoCardsComposer = () => {
  const noCardsComposer = new Composer<GrammyContext>();

  noCardsComposer.use(async (context, next) => {
    const isFeatureEnabled = context.chatSession.chatSettings.enableDeleteCards;
    const areCardsIncluded = context.state.cards && context.state.cards.length > 0;

    if (isFeatureEnabled && areCardsIncluded) {
      await context.deleteMessage();

      const { writeUsername, userId } = getUserData(context);
      const featuresString = getEnabledFeaturesString(context.chatSession.chatSettings);

      await context.replyWithSelfDestructedHTML(getDeleteFeatureMessage({ writeUsername, userId, featuresString }));
    }

    return next();
  });

  return { noCardsComposer };
};
