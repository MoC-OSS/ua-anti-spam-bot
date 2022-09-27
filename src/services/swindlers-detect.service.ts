import { DynamicStorageService } from './dynamic-storage.service';
import { SwindlersBotsService } from './swindlers-bots.service';
import { SwindlersCardsService } from './swindlers-cards.service';
import { SwindlersUrlsService } from './swindlers-urls.service';
import { SwindlersTensorService } from '../tensor/swindlers-tensor.service';

import { optimizeText } from 'ukrainian-ml-optimizer';
import stringSimilarity from 'string-similarity';

export class SwindlersDetectService {
  /**
   * @param {DynamicStorageService} dynamicStorageService
   * @param {SwindlersBotsService} swindlersBotsService
   * @param {SwindlersCardsService} swindlersCardsService
   * @param {SwindlersUrlsService} swindlersUrlsService
   * @param {SwindlersTensorService} swindlersTensorService
   * */
  dynamicStorageService: DynamicStorageService;
  swindlersBotsService: SwindlersBotsService;
  swindlersCardsService: SwindlersCardsService;
  swindlersUrlsService: SwindlersUrlsService;
  swindlersTensorService: SwindlersTensorService;
  SWINDLER_SETTINGS: any;
  constructor(dynamicStorageService, swindlersBotsService, swindlersCardsService, swindlersUrlsService, swindlersTensorService) {
    this.dynamicStorageService = dynamicStorageService;
    this.swindlersBotsService = swindlersBotsService;
    this.swindlersCardsService = swindlersCardsService;
    this.swindlersUrlsService = swindlersUrlsService;
    this.swindlersTensorService = swindlersTensorService;

    this.SWINDLER_SETTINGS = {
      DELETE_CHANCE: 0.8,
      LOG_CHANGE: 0.8,
      SAME_CHECK: 0.9,
      APPEND_TO_SHEET: 0.85,
    };
  }

  /**
   * @param {string} message - message to process
   *
   * @return {SwindlersResult}
   * */
  async isSwindlerMessage(message) {
    const results: any = {};
    const foundSwindlerUrl: any = await this.swindlersUrlsService.processMessage(message);
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
        displayReason: `mention (${foundSwindlerMention.nearestName})`,
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

    const processedMessage = optimizeText(message);

    let lastChance = 0;
    let maxChance = 0;
    const foundSwindler = this.dynamicStorageService.swindlerMessages.some((text) => {
      lastChance = stringSimilarity.compareTwoStrings(processedMessage, text);

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

