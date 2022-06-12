const FuzzySet = require('fuzzyset');

class SwindlersBotsService {
  /**
   * @param {DynamicStorageService} dynamicStorageService
   * @param {number} [rate]
   * */
  constructor(dynamicStorageService, rate = 0.9) {
    this.dynamicStorageService = dynamicStorageService;
    this.rate = rate;
    this.initFuzzySet();

    this.dynamicStorageService.fetchEmmiter.on('fetch', () => {
      this.initFuzzySet();
    });
  }

  initFuzzySet() {
    this.swindlersBotsFuzzySet = FuzzySet(this.dynamicStorageService.swindlerBots);
  }

  /**
   * @param {string} name
   * @param {number} [customRate]
   */
  isSpamBot(name, customRate) {
    const [[rate, nearestName]] = this.swindlersBotsFuzzySet.get(name) || [[0]];
    return {
      isSpam: rate > (customRate || this.rate),
      rate,
      nearestName,
      currentName: name,
    };
  }
}

module.exports = {
  SwindlersBotsService,
};
