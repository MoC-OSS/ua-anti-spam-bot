import { Composer } from 'grammy';

import { getWarnRussianMessage } from '../../../message';
import type { DynamicStorageService } from '../../../services';
import type { GrammyContext } from '../../../types';
import { getRandomItem } from '../../../utils';

export interface WarnRussianComposerProperties {
  dynamicStorageService: DynamicStorageService;
}

/**
 * @description Warn users that the chat is only for ukrainians
 * */
export const getWarnRussianComposer = ({ dynamicStorageService }: WarnRussianComposerProperties) => {
  const warnRussianComposer = new Composer<GrammyContext>();

  warnRussianComposer.use(async (context, next) => {
    const isFeatureEnabled = context.chatSession.chatSettings.enableWarnRussian;
    const isRussianIncluded = context.state.isRussian;

    if (isFeatureEnabled && isRussianIncluded) {
      await context.replyWithSelfDestructedHTML(getWarnRussianMessage(getRandomItem(dynamicStorageService.ukrainianLanguageResponses)), {
        reply_to_message_id: context.msg?.message_id,
      });
    }

    return next();
  });

  return { warnRussianComposer };
};
