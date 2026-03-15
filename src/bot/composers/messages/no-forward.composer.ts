import { Composer } from 'grammy';

import { getDeleteFeatureMessage } from '@message';

import type { GrammyContext } from '@app-types/context';

import { getEnabledFeaturesString, getUserData } from '@utils/generic.util';

/**
 * @description Remove strategic information logic
 * */
export const getNoForwardsComposer = () => {
  const noForwardsComposer = new Composer<GrammyContext>();

  noForwardsComposer.use(async (context, next) => {
    const isFeatureEnabled = context.chatSession.chatSettings.enableDeleteForwards;
    const isForwarded = !!context.msg?.forward_origin;

    if (isFeatureEnabled && isForwarded) {
      await context.deleteMessage();

      const { writeUsername, userId } = getUserData(context);
      const featuresString = getEnabledFeaturesString(context.chatSession.chatSettings);

      if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
        await context.replyWithSelfDestructedHTML(getDeleteFeatureMessage(context, { writeUsername, userId, featuresString }));
      }
    }

    return next();
  });

  return { noForwardsComposer };
};
