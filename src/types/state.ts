import type { Animation, PhotoSize, Sticker, Video } from '@grammyjs/types/message';

import type { ImageType } from './image';
import type { NsfwTensorResult } from './nsfw';
import type { SwindlerTensorResult } from './swindlers';

export interface StateFlavor<S> {
  /**
   * Session data on the context object.
   *
   * **WARNING:** You have to make sure that your state data is not
   * undefined by _providing an initial value to the session middleware_, or by
   * making sure that `ctx.state` is assigned if it is empty! The type
   * system does not include `| undefined` because this is really annoying to
   * work with.
   *
   *  Accessing `ctx.session` by reading or writing will throw if
   * `getSessionKey(ctx) === undefined` for the respective context object
   * `ctx`.
   */
  get state(): S;
  set state(session: S | null | undefined);
}

export interface StateImagePhoto {
  meta: PhotoSize;
  type: ImageType.PHOTO;
  file: Buffer;
  caption?: string;
}

export interface StateImageSticker {
  meta: Sticker;
  type: ImageType.STICKER;
  thumb?: PhotoSize;
  file: Buffer;
}

export interface StateImageParsedFrames {
  fileFrames?: Buffer[];
}

export interface StateImageVideo extends StateImageParsedFrames {
  meta: PhotoSize;
  type: ImageType.VIDEO;
  file: Buffer;
  video: Video;
  caption?: string;
}

export interface StateImageAnimation extends StateImageParsedFrames {
  meta: PhotoSize;
  type: ImageType.ANIMATION;
  file: Buffer;
  animation: Animation;
  caption?: string;
}

export type StateImage = StateImagePhoto | StateImageSticker | StateImageVideo | StateImageAnimation;

/**
 * It requires only-with-text.middleware.js
 * */
interface OnlyWithTextMiddlewareState {
  text?: string;
  photo?: StateImage | null;
  urls?: string[];
  mentions?: string[];
  cards?: string[];
  locations?: string[];
}

interface PerformanceMiddlewareState {
  performanceStart?: DOMHighResTimeStamp;
}

/**
 * It's used to skip text handlers when message already marked as deleted
 * */
interface IsDeletedState {
  isDeleted?: boolean;
}

export type State = OnlyWithTextMiddlewareState &
  IsDeletedState &
  PerformanceMiddlewareState & {
    // TODO move into separate file src/types/swindlers.ts and add enum for reason
    swindlersResult?: {
      isSpam: boolean;
      rate: number;
      reason: string;
    };
    nsfwResult?: {
      tensor: NsfwTensorResult;
      reason: 'preview' | 'frame';
    };
    dataset?: SwindlerTensorResult;
  };
