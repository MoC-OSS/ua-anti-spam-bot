const { env } = require('typed-dotenv').config();

const { googleService } = require('./google.service');

class SwindlersGoogleService {
  /**
   * @param {GoogleService} localGoogleService
   * */
  constructor(localGoogleService) {
    /**
     * @private
     * */
    this.googleService = localGoogleService;
    this.RANGES = {
      TRAINING_NEGATIVES: 'A6:A',
      TRAINING_POSITIVES: 'B6:B',
      BOTS: 'C6:C',
      DOMAINS: 'D6:D',
      TESTING_NEGATIVES: 'E6:E',
      TESTING_POSITIVES: 'F6:F',
      SITES: 'G6:G',
      USERS: 'H6:H',
    };
  }

  /**
   *
   * @namespace Basic methods
   *
   * */

  /**
   * @private
   * @param {string} range - range from {this.RANGES}
   * @param {boolean} [compact=true]
   *
   * @returns Promise<Record<string, any>[] | null>
   * */
  getSheet(range, compact = true) {
    return this.googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, range, compact);
  }

  /**
   * @private
   * @param {string} range - range from {this.RANGES}
   * */
  clearSheet(range) {
    return this.googleService.clearSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, range);
  }

  /**
   * @private
   * @param {string} range - range from {this.RANGES}
   * @param {string[]} values - values to set
   *
   * @returns Promise<any>
   * */
  updateSheet(range, values) {
    return this.googleService.updateSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, values, range);
  }

  /**
   * @private
   * @param {string} range - range from {this.RANGES}
   * @param {string} value - value to append
   *
   * @returns Promise<any>
   * */
  appendToSheet(range, value) {
    return this.googleService.appendToSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, value, range);
  }

  /**
   *
   * @namespace Training cases
   *
   * */

  getTrainingNegatives() {
    return this.getSheet(this.RANGES.TRAINING_NEGATIVES);
  }

  /**
   * @param {string[]} cases - cases to update
   * */
  updateTrainingNegatives(cases) {
    return this.updateSheet(this.RANGES.TRAINING_NEGATIVES, cases);
  }

  clearTrainingNegatives() {
    return this.clearSheet(this.RANGES.TRAINING_NEGATIVES);
  }

  getTrainingPositives() {
    return this.getSheet(this.RANGES.TRAINING_POSITIVES);
  }

  /**
   * @param {string[]} cases - cases to update
   * */
  updateTrainingPositives(cases) {
    return this.updateSheet(this.RANGES.TRAINING_POSITIVES, cases);
  }

  /**
   * @param {string} singleCase - case to append
   * */
  appendTraingPositives(singleCase) {
    return this.appendToSheet(this.RANGES.TRAINING_POSITIVES, singleCase);
  }

  clearTrainingPositives() {
    return this.clearSheet(this.RANGES.TRAINING_POSITIVES);
  }

  /**
   *
   * @namespace Bots
   *
   * */

  getBots() {
    return this.getSheet(this.RANGES.BOTS);
  }

  /**
   * @param {string[]} bots
   */
  updateBots(bots) {
    return this.updateSheet(this.RANGES.BOTS, bots);
  }

  /**
   *
   * @namespace Domains
   *
   * */

  getDomains() {
    return this.getSheet(this.RANGES.DOMAINS);
  }

  /**
   * @param {string[]} domains
   */
  updateDomains(domains) {
    return this.updateSheet(this.RANGES.DOMAINS, domains);
  }

  /**
   *
   * @namespace Testing cases
   *
   * */

  getTestingNegatives() {
    return this.getSheet(this.RANGES.TESTING_NEGATIVES);
  }

  /**
   * @param {string[]} cases - cases to update
   * */
  updateTestingNegatives(cases) {
    return this.updateSheet(this.RANGES.TESTING_NEGATIVES, cases);
  }

  clearTestingNegatives() {
    return this.clearSheet(this.RANGES.TESTING_NEGATIVES);
  }

  getTestingPositives() {
    return this.getSheet(this.RANGES.TESTING_POSITIVES);
  }

  /**
   * @param {string[]} cases - cases to update
   * */
  updateTestingPositives(cases) {
    return this.updateSheet(this.RANGES.TESTING_POSITIVES, cases);
  }

  clearTestingPositives() {
    return this.clearSheet(this.RANGES.TESTING_POSITIVES);
  }

  /**
   *
   * @namespace Sites
   *
   * */

  getSites() {
    return this.getSheet(this.RANGES.SITES);
  }

  /**
   * @param {string[]} sites
   */
  updateSites(sites) {
    return this.updateSheet(this.RANGES.SITES, sites);
  }

  /**
   *
   * @namespace Users
   *
   * */

  getUsers() {
    return this.getSheet(this.RANGES.USERS);
  }
}

const swindlersGoogleService = new SwindlersGoogleService(googleService);

module.exports = {
  swindlersGoogleService,
  SwindlersGoogleService,
};
