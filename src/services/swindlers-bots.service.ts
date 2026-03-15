/**
 * @module swindlers-bots.service
 * @description Detects known swindler bots in messages using fuzzy string matching
 * against a dynamically-updated list of bot usernames.
 */

import FuzzySet from 'fuzzyset';

import type { SwindlersBotsResult } from '@app-types/swindlers';

import type { DynamicStorageService } from './dynamic-storage.service';
import { mentionService } from './mention.service';

export class SwindlersBotsService {
  exceptionMentions: string[] = [];

  swindlersBotsFuzzySet!: FuzzySet;

  constructor(
    private dynamicStorageService: DynamicStorageService,
    private rate = 0.9,
  ) {
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
    const mentions = mentionService.parseMentions(message, this.exceptionMentions);

    if (mentions) {
      let lastResult: SwindlersBotsResult | null = null;

      const hasSwindlerMention = mentions.some((value) => {
        lastResult = this.isSpamBot(value);

        return lastResult.isSpam;
      });

      if (hasSwindlerMention) {
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
