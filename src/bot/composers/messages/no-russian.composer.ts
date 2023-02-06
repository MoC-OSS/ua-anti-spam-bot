import { Composer } from 'grammy';

import { getDeleteRussianMessage } from '../../../message';
import type { DynamicStorageService } from '../../../services';
import type { GrammyContext } from '../../../types';
import { getRandomItem, getUserData } from '../../../utils';

export interface NoRussianComposerProperties {
  dynamicStorageService: DynamicStorageService;
}

/**
 * @description Delete russian language messages
 * */
export const getNoRussianComposer = ({ dynamicStorageService }: NoRussianComposerProperties) => {
  const noRussianComposer = new Composer<GrammyContext>();

  noRussianComposer.use(async (context, next) => {
    const isFeatureEnabled = context.chatSession.chatSettings.enableDeleteRussian;
    const isRussianIncluded = context.state.isRussian;

    if (isFeatureEnabled && isRussianIncluded) {
      await context.deleteMessage();

      const { writeUsername, userId } = getUserData(context);
      await context.replyWithSelfDestructedHTML(
        getDeleteRussianMessage({ writeUsername, userId, message: getRandomItem(dynamicStorageService.ukrainianLanguageResponses) }),
      );
    }

    return next();
  });

  return { noRussianComposer };
};
