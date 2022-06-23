const { env } = require('typed-dotenv').config();
const { optimizeText } = require('ukrainian-ml-optimizer');
const EventEmitter = require('events');

class DynamicStorageService {
  /**
   * @param {GoogleService} googleService
   * @param {any} dataset
   * */
  constructor(googleService, dataset) {
    this.googleService = googleService;
    this.swindlerMessages = [];
    this.swindlerBots = dataset.swindlers_bots;
    this.swindlerDomains = dataset.swindlers_domains || [];
    this.fetchEmmiter = new EventEmitter();
  }

  async init() {
    await this.updateSwindlers();
    setInterval(() => {
      this.updateSwindlers();
    }, 1000 * 60 * 60);
  }

  async updateSwindlers() {
    const sheetRequests = [
      this.googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, 'B6:B'),
      this.googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, 'C6:C'),
      this.googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, 'D6:D'),
    ].map((request) => request.then((response) => response.map((positive) => positive.value)));

    const cases = Promise.all(sheetRequests);

    return cases.then(([swindlerPositives, swindlerBots, swindlerDomains]) => {
      this.swindlerMessages = this.removeDuplicates(swindlerPositives).map(optimizeText).filter(Boolean);
      this.swindlerBots = this.removeDuplicates(swindlerBots);
      this.swindlerDomains = this.removeDuplicates(swindlerDomains);
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
