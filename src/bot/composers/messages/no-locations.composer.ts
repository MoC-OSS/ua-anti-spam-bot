import { Composer } from 'grammy';

import { getDeleteFeatureMessage } from '../../../message';
import type { GrammyContext } from '../../../types';
import { getEnabledFeaturesString, getUserData } from '../../../utils';

/**
 * @description Remove message with any location
 * */
export const getNoLocationsComposer = () => {
  const noLocationsComposer = new Composer<GrammyContext>();

  noLocationsComposer.use(async (context, next) => {
    const isFeatureEnabled = context.chatSession.chatSettings.enableDeleteLocations;
    const areLocationsIncluded = context.state.locations && context.state.locations.length > 0;

    if (isFeatureEnabled && areLocationsIncluded) {
      await context.deleteMessage();

      const { writeUsername, userId } = getUserData(context);
      const featuresString = getEnabledFeaturesString(context.chatSession.chatSettings);

      if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
        await context.replyWithSelfDestructedHTML(getDeleteFeatureMessage({ writeUsername, userId, featuresString }));
      }
    }

    return next();
  });

  return { noLocationsComposer };
};
