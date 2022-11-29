import { Composer } from 'grammy';

import { getDeleteFeatureMessage } from '../../../message';
import type { GrammyContext } from '../../../types';
import { getEnabledFeaturesString, getUserData } from '../../../utils';

/**
 * @description Remove strategic information logic
 * */
export const getNoMentionsComposer = () => {
  const noMentionsComposer = new Composer<GrammyContext>();

  noMentionsComposer.use(async (context, next) => {
    const isFeatureEnabled = context.chatSession.chatSettings.enableDeleteMentions;
    const areUrlsIncluded = context.state.mentions && context.state.mentions.length > 0;

    if (isFeatureEnabled && areUrlsIncluded) {
      await context.deleteMessage();

      const { writeUsername, userId } = getUserData(context);
      const featuresString = getEnabledFeaturesString(context.chatSession.chatSettings);

      await context.replyWithHTML(getDeleteFeatureMessage({ writeUsername, userId, featuresString }));
      context.state.isDeleted = true;
    }

    return next();
  });

  return { noMentionsComposer };
};
