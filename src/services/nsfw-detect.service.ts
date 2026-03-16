/**
 * @module nsfw-detect.service
 * @description Service for detecting NSFW message content using fuzzy string matching.
 * Refreshes its internal FuzzySet when the dynamic storage emits a `fetch` event.
 */

import FuzzySet from 'fuzzyset';

import type { SwindlersBotsResult } from '@app-types/swindlers';

import type { DynamicStorageService } from './dynamic-storage.service';

export class NsfwDetectService {
  nsfwMessagesFuzzySet!: FuzzySet;

  constructor(
    private dynamicStorageService: DynamicStorageService,
    private rate = 0.9,
  ) {
    this.initFuzzySet();

    this.dynamicStorageService.fetchEmitter.on('fetch', () => {
      this.initFuzzySet();
    });
  }

  /**
   * Checks the message for NSFW content using fuzzy matching.
   * @param message - raw message from user to parse
   */
  processMessage(message?: string): SwindlersBotsResult | null {
    const result = this.isSpamMessage(message);

    if (result.isSpam) {
      return result;
    }

    return null;
  }

  /**
   * @description
   * Create and saves FuzzySet based on latest data from dynamic storage
   */
  initFuzzySet() {
    this.nsfwMessagesFuzzySet = FuzzySet(this.dynamicStorageService.nsfwMessages);
  }

  /**
   * Evaluates a message against the NSFW fuzzy set and returns the match result.
   * @param message
   * @param [customRate]
   */
  isSpamMessage(message?: string, customRate?: number): SwindlersBotsResult {
    if (!message) {
      return {
        isSpam: false,
        rate: 0,
        nearestName: '',
        currentName: '',
      };
    }

    const [[rate, nearestName]] = this.nsfwMessagesFuzzySet.get(message) || [[0]];

    return {
      isSpam: rate > (customRate || this.rate),
      rate,
      nearestName,
      currentName: message,
    };
  }
}
