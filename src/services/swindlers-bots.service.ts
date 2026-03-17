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
   * Checks the message for @-mentions matching known swindler bot usernames.
   * @param message - raw message from user to parse
   * @returns detection result if a swindler bot mention is found, null otherwise
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
   * Creates and saves FuzzySet based on latest data from dynamic storage.
   */
  initFuzzySet() {
    this.swindlersBotsFuzzySet = FuzzySet(this.dynamicStorageService.swindlerBots);
  }

  /**
   * Checks whether a username matches a known swindler bot using fuzzy matching.
   * @param name - the username or bot name to check
   * @param [customRate] - optional fuzzy match threshold to override the default rate
   * @returns spam detection result with isSpam flag, match rate, and nearest bot name
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
