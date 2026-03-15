/**
 * @module swindlers-detect.service
 * @description Orchestrator service that runs all swindler-detection checks (URLs, bots, cards, ML tensor)
 * against incoming messages and returns a consolidated detection result.
 */

import { compareTwoStrings } from 'string-similarity';
import { optimizeText } from 'ukrainian-ml-optimizer';

import type { SwindlersTensorService } from '@tensor/swindlers-tensor.service';

import type { SwindlersResult, SwindlersResultSummary } from '@app-types/swindlers';

import type { DynamicStorageService } from './dynamic-storage.service';
import type { SwindlersBotsService } from './swindlers-bots.service';
import type { SwindlersCardsService } from './swindlers-cards.service';
import type { SwindlersUrlsService } from './swindlers-urls.service';

export class SwindlersDetectService {
  swindlerSettings = {
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
  async isSwindlerMessage(message: string): Promise<SwindlersResult> {
    const results: SwindlersResultSummary = {};
    const hasSwindlerUrl = await this.swindlersUrlsService.processMessage(message);

    results.foundSwindlerUrl = hasSwindlerUrl;

    if (hasSwindlerUrl) {
      return {
        isSpam: true,
        rate: hasSwindlerUrl.rate,
        reason: 'site',
        results,
      } as SwindlersResult;
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
      } as SwindlersResult;
    }

    const hasCard = this.swindlersCardsService.processMessage(message);

    results.foundCard = hasCard;

    if (hasCard) {
      return {
        isSpam: true,
        rate: 200,
        reason: 'card',
        results,
      } as SwindlersResult;
    }

    const foundTensor = await this.swindlersTensorService.predict(message, null);

    results.foundTensor = foundTensor;

    if (foundTensor.isSpam) {
      return {
        isSpam: true,
        rate: foundTensor.spamRate,
        reason: 'tensor',
        results,
      } as SwindlersResult;
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

    const hasSwindler = this.dynamicStorageService.swindlerMessages.some((text) => {
      lastChance = compareTwoStrings(processedMessage, text);

      if (lastChance > maxChance) {
        maxChance = lastChance;
      }

      return lastChance >= this.swindlerSettings.DELETE_CHANCE;
    });

    results.foundCompare = {
      foundSwindler: hasSwindler,
      spamRate: maxChance,
    };

    if (hasSwindler) {
      return {
        isSpam: true,
        rate: maxChance,
        reason: 'compare',
        results,
      } as SwindlersResult;
    }

    if (maxChance > this.swindlerSettings.LOG_CHANGE) {
      return {
        isSpam: false,
        rate: maxChance,
        reason: 'compare',
        results,
      } as SwindlersResult;
    }

    return {
      isSpam: false,
      rate: 0,
      reason: 'no match',
      results,
    } as SwindlersResult;
  }
}
