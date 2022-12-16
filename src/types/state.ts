import type { PhotoSize } from '@grammyjs/types/message';

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

export interface StatePhoto {
  meta: PhotoSize;
  file: Buffer;
}

/**
 * It requires only-with-text.middleware.js
 * */
interface OnlyWithTextMiddlewareState {
  text?: string;
  photo?: StatePhoto | null;
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
    nsfwResult?: NsfwTensorResult;
    dataset?: SwindlerTensorResult;
  };
