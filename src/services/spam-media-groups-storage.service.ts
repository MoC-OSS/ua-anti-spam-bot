import ms from 'ms';

import type { GrammyContext } from '../types';

const GROUP_EXPIRATION_TIME = ms('60s');
const GROUP_EXPIRATION_CHECK_INTERVAL = ms('10s');

interface SpamMediaGroupsStorageDataType {
  [key: string]: {
    createdAt: number;
  };
}

export class SpamMediaGroupsStorage {
  private storage: SpamMediaGroupsStorageDataType = {};

  private timer?: NodeJS.Timer;

  constructor() {
    this.initMediaGroupsExpiration();
  }

  private initMediaGroupsExpiration() {
    if (this.timer) return;

    this.timer = setInterval(() => {
      const now = Date.now();

      Object.keys(this.storage).forEach((key) => {
        const duration = now - this.storage[key].createdAt;
        if (duration > GROUP_EXPIRATION_TIME) delete this.storage[key];
      });
      // console.log('🟡', this.storage); //TODO check why empty server logs
    }, GROUP_EXPIRATION_CHECK_INTERVAL);
  }

  private extractKeyFromContext(context: GrammyContext): string {
    const chatId = context.chat?.id;
    const groupId = context.message?.media_group_id;

    if (!chatId || !groupId) throw new Error(`Invalid groupId or chatId`);

    return chatId && groupId ? `${chatId}_${groupId}` : '';
  }

  addSpamMediaGroup(context: GrammyContext) {
    const key = this.extractKeyFromContext(context);

    if (key) this.storage[key] = { createdAt: Date.now() };
  }

  isSpamMediaGroup(context: GrammyContext): boolean {
    const key = this.extractKeyFromContext(context);

    return key ? key in this.storage : false;
  }
}

export const spamMediaGroupsStorage = new SpamMediaGroupsStorage();
