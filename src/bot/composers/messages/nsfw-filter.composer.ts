import { Composer } from 'grammy';

import axios from 'axios';
import FormData from 'form-data';

import { logsChat } from '@bot/creator';

import { LOGS_CHAT_THREAD_IDS } from '@const/logs.const';

import { getDeleteNsfwMessage, nsfwLogsStartMessage } from '@message';

import { environmentConfig } from '@shared/config';

import type { NsfwTensorService } from '@tensor/nsfw-tensor.service';

import type { GrammyContext } from '@app-types/context';
import { ImageType } from '@app-types/image';
import type { NsfwTensorPositiveResult, NsfwTensorResult } from '@app-types/nsfw';
import type { NsfwPhotoResult, StateImageAnimation, StateImageVideo } from '@app-types/state';

import { handleError } from '@utils/error-handler.util';
import { getUserData } from '@utils/generic.util';
import { telegramUtility } from '@utils/util-instances.util';

const host = `http://${environmentConfig.HOST}:${environmentConfig.PORT}`;

/**
 * Save message into logs to review it and track logic
 * @param context - The Grammy context of the incoming message.
 * @returns Promise that resolves when the log message has been sent, or void if no NSFW result or image data.
 */
const saveNsfwMessage = async (context: GrammyContext) => {
  if (!context.state.nsfwResult) {
    return;
  }

  const { userMention, chatMention } = await telegramUtility.getLogsSaveMessageParts(context);
  const imageData = context.state.photo;

  const { deletePrediction } = (context.state.nsfwResult as NsfwPhotoResult).tensor as NsfwTensorPositiveResult;

  if (!imageData) {
    return;
  }

  const { type, meta } = imageData;

  switch (type) {
    /**
     * Save photo message
     */
    case ImageType.PHOTO: {
      const { caption } = imageData;

      await context.api.sendPhoto(logsChat, meta.file_id, {
        caption: `${nsfwLogsStartMessage} ${type} (${(deletePrediction.probability * 100).toFixed(2)}%) from <code>${
          deletePrediction.className
        }</code> by user ${userMention}:\n\n${chatMention || userMention}\n${caption || ''}`,
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.PORN,
      });

      break;
    }

    /**
     * Save sticker message
     */
    case ImageType.VIDEO_STICKER:
    case ImageType.STICKER: {
      const setNameAddition = meta.set_name ? `from <code>${meta.set_name}</code> sticker-pack` : '';

      const stickerMessage = await context.api.sendSticker(logsChat, meta.file_id, {
        // @ts-ignore
        message_thread_id: LOGS_CHAT_THREAD_IDS.PORN,
      });

      await context.api.sendMessage(
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

      break;
    }

    /**
     * Save photo and video message
     */
    case ImageType.ANIMATION:
    case ImageType.VIDEO: {
      const { caption } = imageData;

      const video = (imageData as StateImageVideo).video || (imageData as StateImageAnimation).animation;

      await context.api.sendVideo(logsChat, video.file_id, {
        caption: `${nsfwLogsStartMessage} ${type} by ${context.state.nsfwResult.reason} (${(deletePrediction.probability * 100).toFixed(
          2,
        )}%) from <code>${deletePrediction.className}</code> by user ${userMention}:\n\n${chatMention || userMention}\n${caption || ''}`,
        parse_mode: 'HTML',
        message_thread_id: LOGS_CHAT_THREAD_IDS.PORN,
      });

      break;
    }

    /**
     * Round video notes
     */
    case ImageType.VIDEO_NOTE: {
      const { videoNote } = imageData;

      const videoNoteMessage = await context.api.sendVideoNote(logsChat, videoNote.file_id, {
        message_thread_id: LOGS_CHAT_THREAD_IDS.PORN,
      });

      await context.api.sendMessage(
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

      break;
    }

    /**
     * Unknown type handling
     * Never impossible
     */
    default: {
      await context.api.sendMessage(logsChat, `Unknown unhandled image type ${type} with meta ${JSON.stringify(meta)}`, {
        message_thread_id: LOGS_CHAT_THREAD_IDS.PORN,
      });

      break;
    }
  }
};

/** Properties for the NSFW image/video filter composer. */
export interface NsfwFilterComposerProperties {
  nsfwTensorService: NsfwTensorService;
}

/**
 * Returns a composer that detects and deletes messages containing NSFW images or videos.
 * @param root0 - Composer properties.
 * @param root0.nsfwTensorService - Service used to run NSFW predictions on image/video content.
 * @returns Object containing the NSFW filter composer instance.
 */
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
     */
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
          // eslint-disable-next-line @typescript-eslint/naming-convention
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

        await context.replyWithSelfDestructedHTML(getDeleteNsfwMessage(context, { writeUsername, userId }));
      }
    }

    return next();
  });

  return { nsfwFilterComposer };
};
