const { optimizeText } = require('ukrainian-ml-optimizer');
const stringSimilarity = require('string-similarity');

class SwindlersDetectService {
  /**
   * @param {DynamicStorageService} dynamicStorageService
   * @param {SwindlersBotsService} swindlersBotsService
   * @param {SwindlersCardsService} swindlersCardsService
   * @param {SwindlersUrlsService} swindlersUrlsService
   * @param {SwindlersTensorService} swindlersTensorService
   * */
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
   * */
  async isSwindlerMessage(message) {
    const foundSwindlerUrl = this.swindlersUrlsService.processMessage(message);

    if (foundSwindlerUrl) {
      return {
        isSpam: true,
        rate: foundSwindlerUrl.rate,
        reason: 'site',
      };
    }

    const foundSwindlerMention = this.swindlersBotsService.processMessage(message);

    if (foundSwindlerMention) {
      return {
        isSpam: true,
        rate: foundSwindlerMention.rate,
        reason: `mention (${foundSwindlerMention.nearestName})`,
      };
    }

    const { isSpam, spamRate } = await this.swindlersTensorService.predict(message);

    if (isSpam) {
      return {
        isSpam: true,
        rate: spamRate,
        reason: 'tensor',
      };
    }

    if (spamRate < 0.5) {
      return {
        isSpam: false,
        rate: spamRate,
        reason: 'low tensor rate',
      };
    }

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

    if (foundSwindler) {
      return {
        isSpam: true,
        rate: maxChance,
        reason: 'compare',
      };
    }

    if (maxChance > this.SWINDLER_SETTINGS.LOG_CHANGE) {
      return {
        isSpam: false,
        rate: maxChance,
        reason: 'compare',
      };
    }

    return {
      isSpam: false,
      rate: 0,
      reason: 'no match',
    };
  }
}

module.exports = {
  SwindlersDetectService,
};
