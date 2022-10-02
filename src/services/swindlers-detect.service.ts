import { compareTwoStrings } from 'string-similarity';
import { optimizeText } from 'ukrainian-ml-optimizer';

import { SwindlersTensorService } from '../tensor/swindlers-tensor.service';
import { SwindlersResult, SwindlersResultSummary } from '../types/swindlers';

import { DynamicStorageService } from './dynamic-storage.service';
import { SwindlersBotsService } from './swindlers-bots.service';
import { SwindlersCardsService } from './swindlers-cards.service';
import { SwindlersUrlsService } from './swindlers-urls.service';

export class SwindlersDetectService {
  SWINDLER_SETTINGS = {
    DELETE_CHANCE: 0.8,
    LOG_CHANGE: 0.8,
    SAME_CHECK: 0.9,
    APPEND_TO_SHEET: 0.85,
  };

  constructor(
    private dynamicStorageService: DynamicStorageService,
    private swindlersBotsService: SwindlersBotsService,
    private swindlersCardsService: SwindlersCardsService,
    private swindlersUrlsService: SwindlersUrlsService,
    private swindlersTensorService: SwindlersTensorService,
  ) {}

  /**
   * @param {string} message - message to process
   *
   * @return {SwindlersResult}
   * */
  async isSwindlerMessage(message: string) {
    const results: SwindlersResultSummary = {};
    const foundSwindlerUrl = await this.swindlersUrlsService.processMessage(message);
    results.foundSwindlerUrl = foundSwindlerUrl;

    if (foundSwindlerUrl) {
      return {
        isSpam: true,
        rate: foundSwindlerUrl.rate,
        reason: 'site',
        results,
      };
    }

    const foundSwindlerMention = this.swindlersBotsService.processMessage(message);
    results.foundSwindlerMention = foundSwindlerMention;

    if (foundSwindlerMention) {
      return {
        isSpam: true,
        rate: foundSwindlerMention.rate,
        reason: 'mention',
        match: foundSwindlerMention.nearestName,
        displayReason: `mention (${foundSwindlerMention.nearestName || ''})`,
        results,
      };
    }

    const foundCard = this.swindlersCardsService.processMessage(message);
    results.foundCard = foundCard;

    if (foundCard) {
      return {
        isSpam: true,
        rate: 200,
        reason: 'card',
        results,
      };
    }

    const foundTensor = await this.swindlersTensorService.predict(message, null);
    results.foundTensor = foundTensor;

    if (foundTensor.isSpam) {
      return {
        isSpam: true,
        rate: foundTensor.spamRate,
        reason: 'tensor',
        results,
      };
    }

    // if (spamRate < 0.2) {
    //   return {
    //     isSpam: false,
    //     rate: spamRate,
    //     reason: 'low tensor rate',
    //   };
    // }

    const processedMessage = optimizeText(message) as string;

    let lastChance = 0;
    let maxChance = 0;
    const foundSwindler = this.dynamicStorageService.swindlerMessages.some((text) => {
      lastChance = compareTwoStrings(processedMessage, text) as number;

      if (lastChance > maxChance) {
        maxChance = lastChance;
      }

      return lastChance >= this.SWINDLER_SETTINGS.DELETE_CHANCE;
    });
    results.foundCompare = {
      foundSwindler,
      spamRate: maxChance,
    };

    if (foundSwindler) {
      return {
        isSpam: true,
        rate: maxChance,
        reason: 'compare',
        results,
      };
    }

    if (maxChance > this.SWINDLER_SETTINGS.LOG_CHANGE) {
      return {
        isSpam: false,
        rate: maxChance,
        reason: 'compare',
        results,
      };
    }

    return {
      isSpam: false,
      rate: 0,
      reason: 'no match',
      results,
    };
  }
}
