import axios from 'axios';
import FormData from 'form-data';
import { Composer } from 'grammy';

import { environmentConfig } from '../../../config';
import { logsChat } from '../../../creator';
import { getDeleteNsfwMessage } from '../../../message';
import type { NsfwTensorService } from '../../../tensor';
import type { GrammyContext, NsfwTensorPositiveResult, NsfwTensorResult } from '../../../types';
import { ImageType } from '../../../types';
import { getUserData, handleError, telegramUtil } from '../../../utils';

const host = `http://${environmentConfig.HOST}:${environmentConfig.PORT}`;

/**
 * Save message into logs to review it and track logic
 * */
const saveNsfwMessage = async (context: GrammyContext) => {
  const { userMention, chatMention } = await telegramUtil.getLogsSaveMessageParts(context);
  const imageData = context.state.photo;
  const { deletePrediction } = context.state.nsfwResult as NsfwTensorPositiveResult;

  if (!imageData) {
    return;
  }

  const { type, meta } = imageData;

  switch (type) {
    /**
     * Save photo message
     * */
    case ImageType.PHOTO: {
      const { caption } = imageData;

      return context.api.sendPhoto(logsChat, meta.file_id, {
        caption: `Looks like nsfw ${type} (${(deletePrediction.probability * 100).toFixed(2)}%) from <code>${
          deletePrediction.className
        }</code> by user ${userMention}:\n\n${chatMention || userMention}\n${caption || ''}`,
        parse_mode: 'HTML',
      });
    }

    /**
     * Save sticker message
     * */
    case ImageType.STICKER: {
      const setNameAddition = meta.set_name ? `from <code>${meta.set_name}</code> sticker-pack` : '';

      const stickerMessage = await context.api.sendSticker(logsChat, meta.file_id);
      return context.api.sendMessage(
        logsChat,
        `Looks like nsfw ${type} ${setNameAddition} (${(deletePrediction.probability * 100).toFixed(2)}%) from <code>${
          deletePrediction.className
        }</code> by user ${userMention}:\n\n${chatMention || userMention}`,
        {
          parse_mode: 'HTML',
          reply_to_message_id: stickerMessage.message_id,
        },
      );
    }

    /**
     * Save photo and video message
     * */
    case ImageType.VIDEO: {
      const { caption, video } = imageData;

      return context.api.sendVideo(logsChat, video.file_id, {
        caption: `Looks like nsfw ${type} (${(deletePrediction.probability * 100).toFixed(2)}%) from <code>${
          deletePrediction.className
        }</code> by user ${userMention}:\n\n${chatMention || userMention}\n${caption || ''}`,
        parse_mode: 'HTML',
      });
    }

    /**
     * Unknown type handling
     * Never impossible
     * */
    default: {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      return context.api.sendMessage(logsChat, `Unknown unhandled image type ${type} with meta ${JSON.stringify(meta)}`);
    }
  }
};

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
      let predictionResult: NsfwTensorResult;

      try {
        const formData = new FormData();
        formData.append('image', parsedPhoto.file, { filename: 'image.jpeg' });

        const getServerResponse = () =>
          axios
            .post(`${host}/image`, formData, {
              headers: formData.getHeaders(),
            })
            .then((response: { data: { result: NsfwTensorResult } }) => response.data.result);

        predictionResult = await (environmentConfig.USE_SERVER ? getServerResponse() : nsfwTensorService.predict(parsedPhoto.file));
      } catch (error) {
        handleError(error, 'API_DOWN');
        predictionResult = await nsfwTensorService.predict(parsedPhoto.file);
      }

      context.state.nsfwResult = predictionResult;

      if (predictionResult.isSpam) {
        await context.deleteMessage();
        await saveNsfwMessage(context);

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
