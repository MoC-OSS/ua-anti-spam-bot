import { environmentConfig } from '../config';

import type { GoogleService } from './google.service';
import { googleService as localGoogleService } from './google.service';

export class SwindlersGoogleService {
  SHEETS_START_FROM = 6;

  private SHEET_COLUMNS = {
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

  RANGES = {
    TRAINING_NEGATIVES: this.buildRange(this.SHEET_COLUMNS.TRAINING_NEGATIVES),
    TRAINING_POSITIVES: this.buildRange(this.SHEET_COLUMNS.TRAINING_POSITIVES),
    BOTS: this.buildRange(this.SHEET_COLUMNS.BOTS),
    DOMAINS: this.buildRange(this.SHEET_COLUMNS.DOMAINS),
    TESTING_NEGATIVES: this.buildRange(this.SHEET_COLUMNS.TESTING_NEGATIVES),
    TESTING_POSITIVES: this.buildRange(this.SHEET_COLUMNS.TESTING_POSITIVES),
    SITES: this.buildRange(this.SHEET_COLUMNS.SITES),
    USERS: this.buildRange(this.SHEET_COLUMNS.USERS),
    CARDS: this.buildRange(this.SHEET_COLUMNS.CARDS),
    NOT_SWINDLERS: this.buildRange(this.SHEET_COLUMNS.NOT_SWINDLERS),
    SITE_REGEX: this.buildRange(this.SHEET_COLUMNS.SITE_REGEX),
  };

  constructor(private googleService: GoogleService) {}

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
  getSheet<T extends boolean | true | false = true>(range: string, compact: T) {
    const isCompact = compact === undefined ? (true as T) : compact;
    return this.googleService.getSheet<T>(
      environmentConfig.GOOGLE_SPREADSHEET_ID,
      environmentConfig.GOOGLE_SWINDLERS_SHEET_NAME,
      range,
      isCompact,
    );
  }

  /**
   * @private
   * @param {string} range - range from {this.RANGES}
   * */
  clearSheet(range: string) {
    return this.googleService.clearSheet(environmentConfig.GOOGLE_SPREADSHEET_ID, environmentConfig.GOOGLE_SWINDLERS_SHEET_NAME, range);
  }

  /**
   * @private
   * @param {string} range - range from {this.RANGES}
   * @param {string[]} values - values to set
   *
   * @returns Promise<any>
   * */
  updateSheet(range: string, values: string[]) {
    return this.googleService.updateSheet(
      environmentConfig.GOOGLE_SPREADSHEET_ID,
      environmentConfig.GOOGLE_SWINDLERS_SHEET_NAME,
      values,
      range,
    );
  }

  /**
   * @private
   * @param {string} range - range from {this.RANGES}
   * @param {string} value - value to append
   *
   * @returns Promise<any>
   * */
  appendToSheet(range: string, value: string) {
    return this.googleService.appendToSheet(
      environmentConfig.GOOGLE_SPREADSHEET_ID,
      environmentConfig.GOOGLE_SWINDLERS_SHEET_NAME,
      value,
      range,
    );
  }

  /**
   *
   * @namespace Training cases
   *
   * */

  getTrainingNegatives() {
    return this.getSheet(this.RANGES.TRAINING_NEGATIVES, true);
  }

  /**
   * @param {string[]} cases - cases to update
   * */
  updateTrainingNegatives(cases: string[]) {
    return this.updateSheet(this.RANGES.TRAINING_NEGATIVES, cases);
  }

  clearTrainingNegatives() {
    return this.clearSheet(this.RANGES.TRAINING_NEGATIVES);
  }

  getTrainingPositives<T extends boolean = true>(compact?: T) {
    const isCompact = compact === undefined ? (true as T) : compact;
    return this.getSheet<T>(this.RANGES.TRAINING_POSITIVES, isCompact);
  }

  /**
   * @param {string[]} cases - cases to update
   * */
  updateTrainingPositives(cases: string[]) {
    return this.updateSheet(this.RANGES.TRAINING_POSITIVES, cases);
  }

  /**
   * @param {string} singleCase - case to append
   * */
  async appendTrainingPositives(singleCase: string) {
    const values = await this.getTrainingPositives(false);
    const lastPosition = values[values.length - 1].index + 1;
    return this.appendToSheet(this.appendRange(this.SHEET_COLUMNS.TRAINING_POSITIVES, lastPosition), singleCase);
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
    return this.getSheet(this.RANGES.BOTS, true);
  }

  /**
   * @param {string[]} bots
   */
  updateBots(bots: string[]) {
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
    return this.getSheet(this.RANGES.DOMAINS, true);
  }

  /**
   * @param {string[]} domains
   */
  updateDomains(domains: string[]) {
    return this.updateSheet(this.RANGES.DOMAINS, domains);
  }

  /**
   *
   * @namespace Testing cases
   *
   * */

  getTestingNegatives() {
    return this.getSheet(this.RANGES.TESTING_NEGATIVES, true);
  }

  /**
   * @param {string[]} cases - cases to update
   * */
  updateTestingNegatives(cases: string[]) {
    return this.updateSheet(this.RANGES.TESTING_NEGATIVES, cases);
  }

  clearTestingNegatives() {
    return this.clearSheet(this.RANGES.TESTING_NEGATIVES);
  }

  getTestingPositives() {
    return this.getSheet(this.RANGES.TESTING_POSITIVES, true);
  }

  /**
   * @param {string[]} cases - cases to update
   * */
  updateTestingPositives(cases: string[]) {
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
    return this.getSheet(this.RANGES.SITES, true);
  }

  /**
   * @param {string[]} sites
   */
  updateSites(sites: string[]) {
    return this.updateSheet(this.RANGES.SITES, sites);
  }

  /**
   *
   * @namespace Users
   *
   * */

  getUsers() {
    return this.getSheet(this.RANGES.USERS, true);
  }

  /**
   *
   * @namespace Cards
   *
   * */

  getCards() {
    return this.getSheet(this.RANGES.CARDS, true);
  }

  /**
   * @param {string[]} cards
   */
  updateCards(cards: string[]) {
    return this.updateSheet(this.RANGES.CARDS, cards);
  }

  /**
   *
   * @namespace Not swindlers
   *
   * */

  getNotSwindlers() {
    return this.getSheet(this.RANGES.NOT_SWINDLERS, true);
  }

  /**
   *
   * @namespace Site regex
   *
   * */

  getSiteRegex() {
    return this.getSheet(this.RANGES.SITE_REGEX, true);
  }

  private buildRange(column: string): string {
    return `${column}${this.SHEETS_START_FROM}:${column}`;
  }

  private appendRange(column: string, position: string | number) {
    return `${column}${position}`;
  }
}

export const swindlersGoogleService = new SwindlersGoogleService(localGoogleService);
