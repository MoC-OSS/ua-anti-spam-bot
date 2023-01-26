import { Router } from '@grammyjs/router';
import axios from 'axios';
import { Composer, InputFile } from 'grammy';

import { environmentConfig } from '../../config';
import type { GrammyContext } from '../../types';
import { ImageType } from '../../types';
import { videoService } from '../../video';
import { parsePhoto } from '../middleware';

/**
 * @description Message handling composer
 * */
export const getGetVideoNoteConverterComposer = () => {
  const videoNoteConverterComposer = new Composer<GrammyContext>();

  videoNoteConverterComposer.command('video_note', (context) => {
    if (context.session.step === 'video_note') {
      context.session.step = 'idle';
      return context.reply('Leave video_note mode.\nCall /video_note command again to start it.');
    }

    context.session.step = 'video_note';
    return context.reply('Enter video_note mode.\nUse /video_note again to leave.');
  });

  const router = new Router<GrammyContext>((context) => context.session?.step || 'idle');

  /* Command Register */
  router.route('video_note', parsePhoto, async (context, next) => {
    const video = context.state.photo?.type === ImageType.VIDEO && context.state.photo.video;

    if (!video) {
      context.session.step = 'idle';
      return context.reply('No video, so leaving video_note mode.\nCall /video_note command again to start it.');
    }

    await context.replyWithChatAction('record_video_note');

    const videoName = `${video.file_unique_id}-${video.file_name?.toLowerCase() || 'unknown-type.mp4'}`;
    const videoFile = await context.api.getFile(video.file_id).then((photoResponse) =>
      photoResponse.file_path
        ? axios
            .get<Buffer>(`https://api.telegram.org/file/bot${environmentConfig.BOT_TOKEN}/${photoResponse.file_path}`, {
              responseType: 'arraybuffer',
            })
            .then((response) => response.data)
        : null,
    );

    if (!videoFile) {
      console.info('IMPOSSIBLE: There is no video.', video);
      return next();
    }

    const squareVideoFile = await videoService.convertToVideoNote(videoFile, videoName);

    await context.replyWithChatAction('upload_video_note');
    await context.replyWithVideoNote(new InputFile(squareVideoFile));
  });

  videoNoteConverterComposer.use(router);

  return { videoNoteConverterComposer };
};
