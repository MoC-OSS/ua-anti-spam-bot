import { Composer } from 'grammy';

import type { NsfwTensorService } from '../../../tensor';
import type { GrammyContext } from '../../../types';

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
          await context.reply(
            `✅ Found ${predictionResult.deletePrediction.className} with ${predictionResult.deletePrediction.probability} probability.`,
          );
        }
      } else {
        await context.reply(
          `⛔️ Not found. Highest ${predictionResult.highestPrediction.className} with ${predictionResult.highestPrediction.probability} probability.`,
          { reply_to_message_id: context.msg?.message_id },
        );
      }
    }

    return next();
  });

  return { nsfwFilterComposer };
};
