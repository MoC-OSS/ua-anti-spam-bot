import FuzzySet from 'fuzzyset';
import { removeDuplicates } from 'utils';

import type { SwindlersBotsResult } from '../types';

import type { DynamicStorageService } from './dynamic-storage.service';

export class SwindlersBotsService {
  readonly mentionRegexp = /\B@\w+/g;

  readonly urlRegexp =
    /(https?:\/\/(?:www\.|(?!www))?[\dA-Za-z][\dA-Za-z-]+[\dA-Za-z]\.\S{2,}|www\.[\dA-Za-z][\dA-Za-z-]+[\dA-Za-z]\.\S{2,}|(https?:\/\/(?:www\.|(?!www)))?[\dA-Za-z-]+\.\S{2,}|www\.?[\dA-Za-z]+\.\S{2,})/g;

  readonly telegramDomainRegexp = /^(https?:\/\/)?(www\.)?t\.me\/(.{1,256})/g;

  exceptionMentions: string[] = [];

  swindlersBotsFuzzySet!: FuzzySet;

  constructor(private dynamicStorageService: DynamicStorageService, private rate = 0.9) {
    this.initFuzzySet();
    this.exceptionMentions = this.dynamicStorageService.notSwindlers;

    this.dynamicStorageService.fetchEmitter.on('fetch', () => {
      this.exceptionMentions = this.dynamicStorageService.notSwindlers;
      this.initFuzzySet();
    });
  }

  /**
   * @param {string} message - raw message from user to parse
   */
  processMessage(message: string): SwindlersBotsResult | null {
    const mentions = this.parseMentions(message);
    if (mentions) {
      let lastResult: null | SwindlersBotsResult = null;

      const foundSwindlerMention = mentions.some((value) => {
        lastResult = this.isSpamBot(value);
        return lastResult.isSpam;
      });

      if (foundSwindlerMention) {
        return lastResult;
      }
    }

    return null;
  }

  /**
   * @description
   * Create and saves FuzzySet based on latest data from dynamic storage
   * */
  initFuzzySet() {
    this.swindlersBotsFuzzySet = FuzzySet(this.dynamicStorageService.swindlerBots);
  }

  /**
   * @param {string} message - raw message from user to parse
   *
   * @returns {string[]}
   */
  parseMentions(message: string): string[] {
    const directMentions = message.match(this.mentionRegexp) || [];
    const linkMentions = (message.match(this.urlRegexp) || [])
      .filter((url) => url.split('/').includes('t.me'))
      .map((url) => url.split('/').splice(-1)[0])
      .map((mention) => (mention[mention.length - 1] === '.' ? `@${mention.slice(0, -1)}` : `@${mention}`));

    return removeDuplicates([...directMentions, ...linkMentions]).filter((item) => !this.exceptionMentions.includes(item));
  }

  /**
   * @param {string} name
   * @param {number} [customRate]
   */
  isSpamBot(name: string, customRate?: number): SwindlersBotsResult {
    const [[rate, nearestName]] = this.swindlersBotsFuzzySet.get(name) || [[0]];
    return {
      isSpam: rate > (customRate || this.rate),
      rate,
      nearestName,
      currentName: name,
    };
  }
}
