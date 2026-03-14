import { Router } from '@grammyjs/router';
import { Composer, InputFile } from 'grammy';

import { parsePhoto } from '@bot/middleware/parse-photo.middleware';

import type { GrammyContext } from '@app-types/context';

import { videoUtility } from '@utils/video.util';

import { videoService } from '@video/video.service';

/**
 * @description Message handling composer
 * */
export const getGetVideoNoteConverterComposer = () => {
  const videoNoteConverterComposer = new Composer<GrammyContext>();

  videoNoteConverterComposer.command('video_note', (context) => {
    if (context.session.step === 'video_note') {
      context.session.step = 'idle';

      return context.reply('⛔️ Leave video_note mode.\nCall /video_note command again to start it.');
    }

    context.session.step = 'video_note';

    return context.reply('✅ Enter video_note mode.\nUse /video_note again to leave.');
  });

  const router = new Router<GrammyContext>((context) => context.session?.step || 'idle');

  /* Command Register */
  router.route('video_note', parsePhoto, async (context, next) => {
    const hasVideo = videoUtility.isContextWithVideo(context);

    if (!hasVideo) {
      context.session.step = 'idle';

      return context.reply('⛔️ No video, so leaving video_note mode.\nCall /video_note command again to start it.');
    }

    await context.replyWithChatAction('record_video_note');

    const { videoFile, videoName } = await videoUtility.getVideo(context);

    if (!videoFile) {
      console.info('IMPOSSIBLE: There is no video.', videoFile);

      return next();
    }

    const squareVideoFile = await videoService.convertToVideoNote(videoFile, videoName);

    await context.replyWithChatAction('upload_video_note');
    await context.replyWithVideoNote(new InputFile(squareVideoFile));

    // eslint-disable-next-line unicorn/no-useless-undefined
    return undefined;
  });

  videoNoteConverterComposer.use(router);

  return { videoNoteConverterComposer };
};
