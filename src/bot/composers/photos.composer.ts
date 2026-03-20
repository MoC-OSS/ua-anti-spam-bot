import { Composer } from 'grammy';

import { onlyActiveDefaultSettingFilter } from '@bot/filters/only-active-default-setting.filter';
import { onlyNotDeletedFilter } from '@bot/filters/only-not-deleted.filter';
import { onlyWithPhotoFilter } from '@bot/filters/only-with-photo.filter';
import { botActiveMiddleware } from '@bot/middleware/bot-active.middleware';
import { botRedisActive } from '@bot/middleware/bot-redis-active.middleware';
import { ignoreOld } from '@bot/middleware/ignore-old.middleware';
import { logContextMiddleware } from '@bot/middleware/log-context.middleware';
import { logParsedPhotosMiddleware } from '@bot/middleware/log-parsed-photos.middleware';
import { onlyNotAdmin } from '@bot/middleware/only-not-admin.middleware';
import { onlyWhenBotAdmin } from '@bot/middleware/only-when-bot-admin.middleware';
import { parsePhoto } from '@bot/middleware/parse-photo.middleware';
import { parseVideoFrames } from '@bot/middleware/parse-video-frames.middleware';
import { performanceEndMiddleware } from '@bot/middleware/performance-end.middleware';
import { performanceStartMiddleware } from '@bot/middleware/performance-start.middleware';

import type { GrammyContext, GrammyMiddleware } from '@app-types/context';
import type { DefaultChatSettings } from '@app-types/session';

/** Properties for the photos composer including the NSFW filter sub-composer. */
export interface PhotosComposerProperties {
  nsfwFilterComposer: Composer<GrammyContext>;
}

/**
 * Composer that handles photo, sticker, video, animation, and video note messages through the NSFW filter pipeline.
 * @param root0 - Photos composer properties.
 * @param root0.nsfwFilterComposer - Composer that filters NSFW image and video content.
 * @returns An object containing the photosComposer and registration helper functions.
 */
export const getPhotoComposer = ({ nsfwFilterComposer }: PhotosComposerProperties) => {
  const photosComposer = new Composer<GrammyContext>();

  /**
   * Only these photos will be processed in this composer
   */
  const readyImageComposer = photosComposer
    // Queries to follow
    .on([':photo', ':sticker', ':video', ':animation', ':video_note'])
    // Check if photo has caption and already deleted
    .filter((context) => onlyNotDeletedFilter(context))
    // Filtering messages
    .use(botRedisActive, ignoreOld(300), botActiveMiddleware, onlyNotAdmin, onlyWhenBotAdmin) // 300s = 5m
    // Parse message text and add it to state
    .use(parsePhoto)
    // Filter updates if there are no photo
    .filter((context) => onlyWithPhotoFilter(context))
    // Handle performance start
    .use(performanceStartMiddleware);

  /**
   * Registers a message handler module with correct filter to not make extra checks
   * @param middlewares - One or more composer or middleware instances to register.
   */
  const registerModule = (...middlewares: (Composer<GrammyContext> | GrammyMiddleware)[]) => {
    readyImageComposer.filter((context) => onlyNotDeletedFilter(context)).use(...middlewares);
  };

  /**
   * Register a module that will be called only if optional settings is enabled
   * @param key - The DefaultChatSettings key that must be enabled for this module to run.
   * @param middlewares - One or more composer or middleware instances to register.
   */
  const registerDefaultSettingModule = (key: keyof DefaultChatSettings, ...middlewares: (Composer<GrammyContext> | GrammyMiddleware)[]) => {
    readyImageComposer
      .filter((context) => onlyNotDeletedFilter(context))
      .filter((context) => onlyActiveDefaultSettingFilter(key)(context))
      .use(...middlewares);
  };

  /**
   * Register modules.
   * The order should be right
   */

  /**
   * Register default modules that checks only thumb
   */
  registerDefaultSettingModule('disableNsfwFilter', nsfwFilterComposer);

  /**
   * Re-register modules that will checks video frames as well
   */
  registerModule(parseVideoFrames);
  registerDefaultSettingModule('disableNsfwFilter', nsfwFilterComposer);

  readyImageComposer.use(logParsedPhotosMiddleware);
  readyImageComposer.use(performanceEndMiddleware);
  readyImageComposer.use(logContextMiddleware);

  return { photosComposer };
};
