import axios from 'axios';
import FormData from 'form-data';
import { Composer } from 'grammy';

import { environmentConfig } from '../../../config';
import { LOGS_CHAT_THREAD_IDS } from '../../../const';
import { logsChat } from '../../../creator';
import { getDeleteNsfwMessage, nsfwLogsStartMessage } from '../../../message';
import type { NsfwTensorService } from '../../../tensor';
import type { GrammyContext, NsfwTensorPositiveResult, NsfwTensorResult } from '../../../types';
import { ImageType } from '../../../types';
import type { NsfwPhotoResult, StateImageAnimation, StateImageVideo } from '../../../types/state';
import { getUserData, handleError, telegramUtil } from '../../../utils';

const host = `http://${environmentConfig.HOST}:${environmentConfig.PORT}`;

/**
 * Save message into logs to review it and track logic
 * */
const saveNsfwMessage = async (context: GrammyContext) => {
  if (!context.state.nsfwResult) {
    return;
  }

  const { userMention, chatMention } = await telegramUtil.getLogsSaveMessageParts(context);
  const imageData = context.state.photo;

  const { deletePrediction } = (context.state.nsfwResult as NsfwPhotoResult).tensor as NsfwTensorPositiveResult;

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
        caption: `${nsfwLogsStartMessage} ${type} (${(deletePrediction.probability * 100).toFixed(2)}%) from <code>${
          deletePrediction.className
        }</code> by user ${userMention}:\n\n${chatMention || userMention}\n${caption || ''}`,
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.PORN,
      });
    }

    /**
     * Save sticker message
     * */
    case ImageType.VIDEO_STICKER:
    case ImageType.STICKER: {
      const setNameAddition = meta.set_name ? `from <code>${meta.set_name}</code> sticker-pack` : '';

      const stickerMessage = await context.api.sendSticker(logsChat, meta.file_id, {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        message_thread_id: LOGS_CHAT_THREAD_IDS.PORN,
      });

      return context.api.sendMessage(
        logsChat,
        `${nsfwLogsStartMessage} ${type} ${context.state.nsfwResult.reason} ${setNameAddition} (${(
          deletePrediction.probability * 100
        ).toFixed(2)}%) from <code>${deletePrediction.className}</code> by user ${userMention}:\n\n${chatMention || userMention}`,
        {
          parse_mode: 'HTML',
          message_thread_id: LOGS_CHAT_THREAD_IDS.PORN,
          reply_to_message_id: stickerMessage.message_id,
        },
      );
    }

    /**
     * Save photo and video message
     * */
    case ImageType.ANIMATION:
    case ImageType.VIDEO: {
      const { caption } = imageData;

      const video = (imageData as StateImageVideo).video || (imageData as StateImageAnimation).animation;

      return context.api.sendVideo(logsChat, video.file_id, {
        caption: `${nsfwLogsStartMessage} ${type} by ${context.state.nsfwResult.reason} (${(deletePrediction.probability * 100).toFixed(
          2,
        )}%) from <code>${deletePrediction.className}</code> by user ${userMention}:\n\n${chatMention || userMention}\n${caption || ''}`,
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.PORN,
      });
    }

    /**
     * Round video notes
     * */
    case ImageType.VIDEO_NOTE: {
      const { videoNote } = imageData;

      const videoNoteMessage = await context.api.sendVideoNote(logsChat, videoNote.file_id, {
        message_thread_id: LOGS_CHAT_THREAD_IDS.PORN,
      });

      return context.api.sendMessage(
        logsChat,
        `${nsfwLogsStartMessage} ${type} ${context.state.nsfwResult.reason} (${(deletePrediction.probability * 100).toFixed(
          2,
        )}%) from <code>${deletePrediction.className}</code> by user ${userMention}:\n\n${chatMention || userMention}`,
        {
          parse_mode: 'HTML',
          reply_to_message_id: videoNoteMessage.message_id,
          message_thread_id: LOGS_CHAT_THREAD_IDS.PORN,
        },
      );
    }

    /**
     * Unknown type handling
     * Never impossible
     * */
    default: {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      return context.api.sendMessage(logsChat, `Unknown unhandled image type ${type} with meta ${JSON.stringify(meta)}`, {
        message_thread_id: LOGS_CHAT_THREAD_IDS.PORN,
      });
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
    const hasFrames = !!parsedPhoto && 'fileFrames' in parsedPhoto;

    const isThumbnail = parsedPhoto && !hasFrames;

    if (isThumbnail && parsedPhoto.file === null) {
      return next();
    }

    /**
     * Get preview or extracted frames to check
     * */
    const imageBuffers: Buffer[] = parsedPhoto && !hasFrames ? [parsedPhoto.file as Buffer] : parsedPhoto?.fileFrames || [];

    if (imageBuffers.length === 0) {
      return next();
    }

    let predictionResult: NsfwTensorResult;

    try {
      const formData = new FormData();
      imageBuffers.forEach((photo, index) => {
        formData.append('image', photo, { filename: `image-${index}.jpeg` });
      });

      const getServerResponse = () =>
        axios
          .post(`${host}/image`, formData, {
            headers: formData.getHeaders(),
          })
          .then((response: { data: { result: NsfwTensorResult } }) => response.data.result);

      predictionResult = await (environmentConfig.USE_SERVER ? getServerResponse() : nsfwTensorService.predictVideo(imageBuffers));
    } catch (error) {
      handleError(error, 'API_DOWN');
      predictionResult = await nsfwTensorService.predictVideo(imageBuffers);
    }

    context.state.nsfwResult = {
      tensor: predictionResult,
      reason: hasFrames ? 'frame' : 'preview',
    };

    if (predictionResult.isSpam) {
      await context.deleteMessage();
      await saveNsfwMessage(context);

      if (context.chatSession.chatSettings.disableDeleteMessage !== true) {
        const { writeUsername, userId } = getUserData(context);

        await context.replyWithSelfDestructedHTML(getDeleteNsfwMessage({ writeUsername, userId }));
      }
    }

    return next();
  });

  return { nsfwFilterComposer };
};
