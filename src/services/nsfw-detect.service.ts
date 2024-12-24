import FuzzySet from 'fuzzyset';

import type { SwindlersBotsResult } from '../types';

import type { DynamicStorageService } from './dynamic-storage.service';

export class NsfwDetectService {
  nsfwMessagesFuzzySet!: FuzzySet;

  constructor(private dynamicStorageService: DynamicStorageService, private rate = 0.9) {
    this.initFuzzySet();

    this.dynamicStorageService.fetchEmitter.on('fetch', () => {
      this.initFuzzySet();
    });
  }

  /**
   * @param {string} message - raw message from user to parse
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
   * */
  initFuzzySet() {
    this.nsfwMessagesFuzzySet = FuzzySet(this.dynamicStorageService.nsfwMessages);
  }

  /**
   * @param {string} message
   * @param {number} [customRate]
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
