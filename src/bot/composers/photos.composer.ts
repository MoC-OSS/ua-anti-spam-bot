import { Composer } from 'grammy';

import type { DefaultChatSettings, GrammyContext, GrammyMiddleware } from '../../types';
import { onlyActiveDefaultSettingFilter, onlyNotDeletedFilter, onlyWithPhotoFilter } from '../filters';
import {
  botActiveMiddleware,
  botRedisActive,
  ignoreOld,
  logContextMiddleware,
  onlyNotAdmin,
  onlyWhenBotAdmin,
  parsePhotos,
  performanceEndMiddleware,
  performanceStartMiddleware,
} from '../middleware';

export interface PhotosComposerProperties {
  nsfwFilterComposer: Composer<GrammyContext>;
}

/**
 * @description Photo handling composer
 * */
export const getPhotoComposer = ({ nsfwFilterComposer }: PhotosComposerProperties) => {
  const photosComposer = new Composer<GrammyContext>();

  /**
   * Only these photos will be processed in this composer
   * */
  const readyImageComposer = photosComposer
    .on(':photo') // Filtering messages
    .use(botRedisActive, ignoreOld(60), botActiveMiddleware, onlyNotAdmin, onlyWhenBotAdmin)
    // Parse message text and add it to state
    .use(parsePhotos)
    // Filter updates if there are no photo
    .filter((context) => onlyWithPhotoFilter(context))
    // Handle performance start
    .use(performanceStartMiddleware);

  /**
   * Register a module that will be called only if optional settings is enabled
   * */
  const registerDefaultSettingModule = (key: keyof DefaultChatSettings, ...middlewares: (Composer<GrammyContext> | GrammyMiddleware)[]) => {
    readyImageComposer
      .filter((context) => onlyNotDeletedFilter(context))
      .filter((context) => onlyActiveDefaultSettingFilter(key)(context))
      .use(...middlewares);
  };

  /**
   * Register modules.
   * The order should be right
   * */
  registerDefaultSettingModule('disableNsfwFilter', parsePhotos, nsfwFilterComposer);

  readyImageComposer.use(performanceEndMiddleware);
  readyImageComposer.use(logContextMiddleware);

  return { photosComposer };
};
