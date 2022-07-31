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
    this.SHEETS_START_FROM = 6;
    this.RANGE = (column) => `${column}${this.SHEETS_START_FROM}:${column}`;
    this.APPEND_RANGE = (column, position) => `${column}${position}`;
    this.SHEET_COLUMNS = {
      TRAINING_NEGATIVES: 'A',
      TRAINING_POSITIVES: 'B',
      BOTS: 'C',
      DOMAINS: 'D',
      TESTING_NEGATIVES: 'E',
      TESTING_POSITIVES: 'F',
      SITES: 'G',
      USERS: 'H',
      CARDS: 'I',
      NOT_SWINDLERS: 'J',
      SITE_REGEX: 'K',
    };
    this.RANGES = {
      TRAINING_NEGATIVES: this.RANGE(this.SHEET_COLUMNS.TRAINING_NEGATIVES),
      TRAINING_POSITIVES: this.RANGE(this.SHEET_COLUMNS.TRAINING_POSITIVES),
      BOTS: this.RANGE(this.SHEET_COLUMNS.BOTS),
      DOMAINS: this.RANGE(this.SHEET_COLUMNS.DOMAINS),
      TESTING_NEGATIVES: this.RANGE(this.SHEET_COLUMNS.TESTING_NEGATIVES),
      TESTING_POSITIVES: this.RANGE(this.SHEET_COLUMNS.TESTING_POSITIVES),
      SITES: this.RANGE(this.SHEET_COLUMNS.SITES),
      USERS: this.RANGE(this.SHEET_COLUMNS.USERS),
      CARDS: this.RANGE(this.SHEET_COLUMNS.CARDS),
      NOT_SWINDLERS: this.RANGE(this.SHEET_COLUMNS.NOT_SWINDLERS),
      SITE_REGEX: this.RANGE(this.SHEET_COLUMNS.SITE_REGEX),
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

  getTrainingPositives(compact = true) {
    return this.getSheet(this.RANGES.TRAINING_POSITIVES, compact);
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
  async appendTrainingPositives(singleCase) {
    const values = await this.getTrainingPositives(false);
    const lastPosition = values[values.length - 1].index + 1;
    return this.appendToSheet(this.APPEND_RANGE(this.SHEET_COLUMNS.TRAINING_POSITIVES, lastPosition), singleCase);
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

  clearBots() {
    return this.clearSheet(this.RANGES.BOTS);
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

  /**
   *
   * @namespace Cards
   *
   * */

  getCards() {
    return this.getSheet(this.RANGES.CARDS);
  }

  /**
   * @param {string[]} cards
   */
  updateCards(cards) {
    return this.updateSheet(this.RANGES.CARDS, cards);
  }

  /**
   *
   * @namespace Not swindlers
   *
   * */

  getNotSwindlers() {
    return this.getSheet(this.RANGES.NOT_SWINDLERS);
  }

  /**
   *
   * @namespace Site regex
   *
   * */

  getSiteRegex() {
    return this.getSheet(this.RANGES.SITE_REGEX);
  }
}

const swindlersGoogleService = new SwindlersGoogleService(googleService);

module.exports = {
  swindlersGoogleService,
  SwindlersGoogleService,
};
