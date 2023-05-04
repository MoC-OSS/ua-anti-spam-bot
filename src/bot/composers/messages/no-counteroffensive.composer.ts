import { Composer } from 'grammy';

import { getDeleteCounteroffensiveMessage } from '../../../message';
import type { DynamicStorageService } from '../../../services';
import type { GrammyContext } from '../../../types';
import { getUserData } from '../../../utils';

export interface NoCounterOffensiveComposerProperties {
  dynamicStorageService: DynamicStorageService;
}

/**
 * @description Remove messages which includes counteroffensive information
 * */
export const getNoCounterOffensiveComposer = ({ dynamicStorageService }: NoCounterOffensiveComposerProperties) => {
  const noCounterOffensiveComposer = new Composer<GrammyContext>();

  noCounterOffensiveComposer.use(async (context, next) => {
    const { text } = context.state;

    if (!text) {
      return next();
    }

    const searchText = text.toLowerCase();

    const isIncluded = dynamicStorageService.counteroffensiveTriggers.some((trigger) => {
      if (trigger instanceof RegExp) {
        return trigger.test(searchText);
      }

      return searchText.includes(trigger);
    });

    if (isIncluded) {
      await context.deleteMessage();

      const { writeUsername, userId } = getUserData(context);

      if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
        await context.replyWithSelfDestructedHTML(getDeleteCounteroffensiveMessage({ writeUsername, userId }));
      }
    }

    return next();
  });

  return { noCounterOffensiveComposer };
};
