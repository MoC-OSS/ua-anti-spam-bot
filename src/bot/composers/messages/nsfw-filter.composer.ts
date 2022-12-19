import { Composer } from 'grammy';

import { getDeleteNsfwMessage } from '../../../message';
import type { NsfwTensorService } from '../../../tensor';
import type { GrammyContext } from '../../../types';
import { getUserData } from '../../../utils';

export interface NsfwFilterComposerProperties {
  nsfwTensorService: NsfwTensorService;
}

/**
 * @description Remove nsfw content
 * */
export const getNsfwFilterComposer = ({ nsfwTensorService }: NsfwFilterComposerProperties) => {
  const nsfwFilterComposer = new Composer<GrammyContext>();

  nsfwFilterComposer.use(async (context, next) => {
    const parsedPhoto = context.state.photo;

    if (parsedPhoto) {
      const predictionResult = await nsfwTensorService.predict(parsedPhoto.file);

      context.state.nsfwResult = predictionResult;

      if (predictionResult.isSpam) {
        await context.deleteMessage();

        if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
          const { writeUsername, userId } = getUserData(context);

          await context.replyWithSelfDestructedHTML(getDeleteNsfwMessage({ writeUsername, userId }));
        }
      }
    }

    return next();
  });

  return { nsfwFilterComposer };
};
