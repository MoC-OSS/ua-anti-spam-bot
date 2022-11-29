import { Composer } from 'grammy';

import { getDeleteFeatureMessage } from '../../../message';
import type { GrammyContext } from '../../../types';
import { getEnabledFeaturesString, getUserData } from '../../../utils';

/**
 * @description Remove strategic information logic
 * */
export const getNoForwardsComposer = () => {
  const noForwardsComposer = new Composer<GrammyContext>();

  noForwardsComposer.use(async (context, next) => {
    const isFeatureEnabled = context.chatSession.chatSettings.enableDeleteForwards;
    const isForwarded = !!context.msg?.forward_from;

    if (isFeatureEnabled && isForwarded) {
      await context.deleteMessage();

      const { writeUsername, userId } = getUserData(context);
      const featuresString = getEnabledFeaturesString(context.chatSession.chatSettings);

      await context.replyWithHTML(getDeleteFeatureMessage({ writeUsername, userId, featuresString }));
      context.state.isDeleted = true;
    }

    return next();
  });

  return { noForwardsComposer };
};
