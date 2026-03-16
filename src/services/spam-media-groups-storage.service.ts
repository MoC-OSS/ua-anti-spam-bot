/**
 * @module spam-media-groups-storage.service
 * @description Temporary in-memory storage for spam media group IDs.
 * Tracks which media groups have been flagged to avoid duplicate deletions,
 * with automatic expiration of stale entries.
 */

import ms from 'ms';

import type { GrammyContext } from '@app-types/context';

const GROUP_EXPIRATION_TIME = ms('60s');
const GROUP_EXPIRATION_CHECK_INTERVAL = ms('10s');

interface SpamMediaGroupsStorageDataType {
  [key: string]: {
    createdAt: number;
  };
}

export class SpamMediaGroupsStorage {
  private storage: SpamMediaGroupsStorageDataType = {};

  // eslint-disable-next-line sonarjs/deprecation
  private timer?: NodeJS.Timer;

  constructor() {
    this.initMediaGroupsExpiration();
  }

  private initMediaGroupsExpiration() {
    if (this.timer) {
      return;
    }

    this.timer = setInterval(() => {
      const now = Date.now();

      Object.keys(this.storage).forEach((key) => {
        // eslint-disable-next-line security/detect-object-injection
        const duration = now - this.storage[key].createdAt;

        if (duration > GROUP_EXPIRATION_TIME) {
          // eslint-disable-next-line security/detect-object-injection
          delete this.storage[key];
        }
      });
      // console.log('🟡', this.storage); // NOTE: check why empty server logs
    }, GROUP_EXPIRATION_CHECK_INTERVAL);
  }

  private extractKeyFromContext(context: GrammyContext): string {
    const chatId = context.chat?.id;
    const groupId = context.message?.media_group_id;

    if (!chatId || !groupId) {
      throw new Error('Invalid groupId or chatId');
    }

    return chatId && groupId ? `${chatId}_${groupId}` : '';
  }

  addSpamMediaGroup(context: GrammyContext) {
    const key = this.extractKeyFromContext(context);

    if (key) {
      // eslint-disable-next-line security/detect-object-injection
      this.storage[key] = { createdAt: Date.now() };
    }
  }

  isSpamMediaGroup(context: GrammyContext): boolean {
    const key = this.extractKeyFromContext(context);

    return key ? key in this.storage : false;
  }
}

export const spamMediaGroupsStorage = new SpamMediaGroupsStorage();
