const { env } = require('typed-dotenv').config();

class DynamicStorageService {
  /**
   * @param {GoogleService} localGoogleService
   * @param {any} localDataset
   * */
  constructor(localGoogleService, localDataset) {
    this.googleService = localGoogleService;
    this.swindlerMessages = [];
    this.swindlerBots = localDataset.swindlers_bots;
    // this.immediately = localDataset.immediately;
  }

  async init() {
    this.updateSwindlers();
    setInterval(() => {
      this.updateSwindlers();
    }, 1000 * 60 * 60);
  }

  async updateSwindlers() {
    const sheetRequests = [
      this.googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, 'B6:B'),
      this.googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, 'C6:C'),
    ].map((request) => request.then((response) => response.map((positive) => positive.value)));

    const cases = Promise.all(sheetRequests);

    return cases.then(([swindlerPositives, swindlerBots]) => {
      console.info('got DynamicStorageService messages', new Date());
      this.swindlerMessages = this.smartAppend(this.swindlerMessages, swindlerPositives);
      this.swindlerBots = this.smartAppend(this.swindlerBots, swindlerBots);
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
