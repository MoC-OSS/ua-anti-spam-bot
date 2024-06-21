import type { User } from '@grammyjs/types/manage';
import type { Animation, MessageEntity, PhotoSize, Sticker, Video, VideoNote } from '@grammyjs/types/message';

import type { ImageType } from './image';
import type { LanguageDetectionResult } from './language-detection';
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
  file: Buffer;
}

export interface StateImageParsedFrames {
  fileFrames?: Buffer[];
}

export interface StateImageVideoSticker extends StateImageParsedFrames {
  meta: Sticker;
  type: ImageType.VIDEO_STICKER;
  thumb: PhotoSize;
  file: Buffer;
}

export interface StateImageVideo extends StateImageParsedFrames {
  meta: PhotoSize;
  type: ImageType.VIDEO;
  file: Buffer;
  video: Video;
  caption?: string;
}

export interface StateImageVideoNote extends StateImageParsedFrames {
  meta: PhotoSize;
  type: ImageType.VIDEO_NOTE;
  file: Buffer | null;
  videoNote: VideoNote;
}

export interface StateImageAnimation extends StateImageParsedFrames {
  meta: PhotoSize;
  type: ImageType.ANIMATION;
  file: Buffer | null; // sometimes animations doesn't have preview?
  animation: Animation;
  caption?: string;
}

export type StateImage =
  | StateImagePhoto
  | StateImageSticker
  | StateImageVideoSticker
  | StateImageVideo
  | StateImageVideoNote
  | StateImageAnimation;

export type StateVideoFormats = Video | Sticker | Animation | VideoNote;

export type StateEntity =
  | (Exclude<MessageEntity, MessageEntity.TextMentionMessageEntity> & { value: string })
  | (MessageEntity.TextMentionMessageEntity & { value: User });

export interface CounterOffensivePositiveResult {
  result: true;
  percent: number;
  reason: string | RegExp;
}

export interface CounterOffensiveNegativeResult {
  result: false;
  percent: 0;
}

export type CounterOffensiveResult = CounterOffensivePositiveResult | CounterOffensiveNegativeResult;

/**
 * It requires only-with-text.middleware.js
 * */
interface OnlyWithTextMiddlewareState {
  text?: string;
  clearText?: string;
  photo?: StateImage | null;
  urls?: string[];
  mentions?: string[];
  cards?: string[];
  locations?: string[];
  isRussian?: LanguageDetectionResult;
  isCounterOffensive?: CounterOffensiveResult;
  entities?: StateEntity[];
}

interface PerformanceMiddlewareState {
  performanceStart?: number;
}

/**
 * It's used to skip text handlers when message already marked as deleted
 * */
interface IsDeletedState {
  isDeleted?: boolean;
}
interface StateIsAdmin {
  isUserAdmin: boolean;
}

export type State = OnlyWithTextMiddlewareState &
  IsDeletedState &
  PerformanceMiddlewareState &
  StateIsAdmin & {
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
