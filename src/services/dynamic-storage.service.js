const { optimizeText } = require('ukrainian-ml-optimizer');
const EventEmitter = require('events');

class DynamicStorageService {
  /**
   * @param {SwindlersGoogleService} swindlersGoogleService
   * @param {any} dataset
   * */
  constructor(swindlersGoogleService, dataset) {
    this.swindlersGoogleService = swindlersGoogleService;
    this.swindlerMessages = [];
    this.swindlerBots = dataset.swindlers_bots;
    this.swindlerDomains = dataset.swindlers_domains || [];
    this.notSwindlers = [];
    this.fetchEmmiter = new EventEmitter();
  }

  async init() {
    await this.updateSwindlers();
    setInterval(() => {
      this.updateSwindlers();
    }, 1000 * 60 * 60);
  }

  async updateSwindlers() {
    const cases = Promise.all([
      this.swindlersGoogleService.getTrainingPositives(),
      this.swindlersGoogleService.getBots(),
      this.swindlersGoogleService.getDomains(),
      this.swindlersGoogleService.getNotSwindlers(),
    ]);

    return cases.then(([swindlerPositives, swindlerBots, swindlerDomains, notSwindlers]) => {
      this.swindlerMessages = this.removeDuplicates(swindlerPositives).map(optimizeText).filter(Boolean);
      this.swindlerBots = this.removeDuplicates(swindlerBots);
      this.swindlerDomains = this.removeDuplicates(swindlerDomains);
      this.notSwindlers = this.removeDuplicates(notSwindlers);
      this.fetchEmmiter.emit('fetch');
      console.info('got DynamicStorageService messages', new Date());
    });
  }

  smartAppend(arr1, arr2) {
    return this.removeDuplicates([...arr1, ...arr2]);
  }

  removeDuplicates(array) {
    return [...new Set(array)];
  }
}

module.exports = {
  DynamicStorageService,
};
