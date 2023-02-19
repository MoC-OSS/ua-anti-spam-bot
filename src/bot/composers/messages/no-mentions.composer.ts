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
    const areMentionsIncluded = context.state.mentions && context.state.mentions.length > 0;

    if (isFeatureEnabled && areMentionsIncluded) {
      await context.deleteMessage();

      const { writeUsername, userId } = getUserData(context);
      const featuresString = getEnabledFeaturesString(context.chatSession.chatSettings);

      if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
        await context.replyWithSelfDestructedHTML(getDeleteFeatureMessage({ writeUsername, userId, featuresString }));
      }
    }

    return next();
  });

  return { noMentionsComposer };
};
