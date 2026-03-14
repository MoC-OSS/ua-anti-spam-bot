import { GOOGLE_SHEETS_NAMES } from '@const/google-sheets.const';

import { environmentConfig } from '../config';

import type { GoogleService } from './google.service';
import { googleService as localGoogleService } from './google.service';

export class SwindlersGoogleService {
  sheetsStartFrom = 6;

  private sheetColumns = {
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

  ranges = {
    TRAINING_NEGATIVES: this.buildRange(this.sheetColumns.TRAINING_NEGATIVES),
    TRAINING_POSITIVES: this.buildRange(this.sheetColumns.TRAINING_POSITIVES),
    BOTS: this.buildRange(this.sheetColumns.BOTS),
    DOMAINS: this.buildRange(this.sheetColumns.DOMAINS),
    TESTING_NEGATIVES: this.buildRange(this.sheetColumns.TESTING_NEGATIVES),
    TESTING_POSITIVES: this.buildRange(this.sheetColumns.TESTING_POSITIVES),
    SITES: this.buildRange(this.sheetColumns.SITES),
    USERS: this.buildRange(this.sheetColumns.USERS),
    CARDS: this.buildRange(this.sheetColumns.CARDS),
    NOT_SWINDLERS: this.buildRange(this.sheetColumns.NOT_SWINDLERS),
    SITE_REGEX: this.buildRange(this.sheetColumns.SITE_REGEX),
  };

  constructor(private googleService: GoogleService) {}

  /**
   *
   * @namespace Basic methods
   *
   * */

  /**
   * @private
   * @param {string} range - range from {this.ranges}
   * @param {boolean} [compact=true]
   *
   * @returns Promise<Record<string, any>[] | null>
   * */
  getSheet<T extends false | true = true>(range: string, compact: T) {
    const isCompact = compact === undefined ? (true as T) : compact;

    return this.googleService.getSheet<T>(environmentConfig.GOOGLE_SPREADSHEET_ID, GOOGLE_SHEETS_NAMES.SWINDLERS, range, isCompact);
  }

  /**
   * @private
   * @param {string} range - range from {this.ranges}
   * */
  clearSheet(range: string) {
    return this.googleService.clearSheet(environmentConfig.GOOGLE_SPREADSHEET_ID, GOOGLE_SHEETS_NAMES.SWINDLERS, range);
  }

  /**
   * @private
   * @param {string} range - range from {this.ranges}
   * @param {string[]} values - values to set
   *
   * @returns Promise<any>
   * */
  updateSheet(range: string, values: string[]) {
    return this.googleService.updateSheet(environmentConfig.GOOGLE_SPREADSHEET_ID, GOOGLE_SHEETS_NAMES.SWINDLERS, values, range);
  }

  /**
   * @private
   * @param {string} range - range from {this.ranges}
   * @param {string} value - value to append
   *
   * @returns Promise<any>
   * */
  appendToSheet(range: string, value: string) {
    return this.googleService.appendToSheet(environmentConfig.GOOGLE_SPREADSHEET_ID, GOOGLE_SHEETS_NAMES.SWINDLERS, value, range);
  }

  /**
   * @description Fixes a problem append
   * */
  async smartAppendToSheet(range: string, value: string) {
    const values = await this.getSheet(range, true);

    await this.clearSheet(range);

    return this.googleService.updateSheet(
      environmentConfig.GOOGLE_SPREADSHEET_ID,
      GOOGLE_SHEETS_NAMES.SWINDLERS,
      [...values, value],
      range,
    );
  }

  /**
   *
   * @namespace Training cases
   *
   * */

  getTrainingNegatives() {
    return this.getSheet(this.ranges.TRAINING_NEGATIVES, true);
  }

  /**
   * @param {string[]} cases - cases to update
   * */
  updateTrainingNegatives(cases: string[]) {
    return this.updateSheet(this.ranges.TRAINING_NEGATIVES, cases);
  }

  clearTrainingNegatives() {
    return this.clearSheet(this.ranges.TRAINING_NEGATIVES);
  }

  getTrainingPositives<T extends boolean = true>(compact?: T) {
    const isCompact = compact === undefined ? (true as T) : compact;

    return this.getSheet<T>(this.ranges.TRAINING_POSITIVES, isCompact);
  }

  /**
   * @param {string[]} cases - cases to update
   * */
  updateTrainingPositives(cases: string[]) {
    return this.updateSheet(this.ranges.TRAINING_POSITIVES, cases);
  }

  /**
   * @param {string} singleCase - case to append
   * */
  async appendTrainingPositives(singleCase: string) {
    const values = await this.getTrainingPositives(false);
    const lastPosition = (values.at(-1)?.index || 0) + 1;

    return this.appendToSheet(this.appendRange(this.sheetColumns.TRAINING_POSITIVES, lastPosition), singleCase);
  }

  clearTrainingPositives() {
    return this.clearSheet(this.ranges.TRAINING_POSITIVES);
  }

  /**
   *
   * @namespace Bots
   *
   * */

  getBots() {
    return this.getSheet(this.ranges.BOTS, true);
  }

  appendBot(bot: string) {
    return this.smartAppendToSheet(this.ranges.BOTS, bot);
  }

  /**
   * @param {string[]} bots
   */
  updateBots(bots: string[]) {
    return this.updateSheet(this.ranges.BOTS, bots);
  }

  clearBots() {
    return this.clearSheet(this.ranges.BOTS);
  }

  /**
   *
   * @namespace Domains
   *
   * */

  getDomains() {
    return this.getSheet(this.ranges.DOMAINS, true);
  }

  /**
   * @param {string[]} domains
   */
  updateDomains(domains: string[]) {
    return this.updateSheet(this.ranges.DOMAINS, domains);
  }

  /**
   *
   * @namespace Testing cases
   *
   * */

  getTestingNegatives() {
    return this.getSheet(this.ranges.TESTING_NEGATIVES, true);
  }

  /**
   * @param {string[]} cases - cases to update
   * */
  updateTestingNegatives(cases: string[]) {
    return this.updateSheet(this.ranges.TESTING_NEGATIVES, cases);
  }

  clearTestingNegatives() {
    return this.clearSheet(this.ranges.TESTING_NEGATIVES);
  }

  getTestingPositives() {
    return this.getSheet(this.ranges.TESTING_POSITIVES, true);
  }

  /**
   * @param {string[]} cases - cases to update
   * */
  updateTestingPositives(cases: string[]) {
    return this.updateSheet(this.ranges.TESTING_POSITIVES, cases);
  }

  clearTestingPositives() {
    return this.clearSheet(this.ranges.TESTING_POSITIVES);
  }

  /**
   *
   * @namespace Sites
   *
   * */

  getSites() {
    return this.getSheet(this.ranges.SITES, true);
  }

  /**
   * @param {string[]} sites
   */
  updateSites(sites: string[]) {
    return this.updateSheet(this.ranges.SITES, sites);
  }

  /**
   *
   * @namespace Users
   *
   * */

  getUsers() {
    return this.getSheet(this.ranges.USERS, true);
  }

  /**
   *
   * @namespace Cards
   *
   * */

  getCards() {
    return this.getSheet(this.ranges.CARDS, true);
  }

  /**
   * @param {string[]} cards
   */
  updateCards(cards: string[]) {
    return this.updateSheet(this.ranges.CARDS, cards);
  }

  /**
   *
   * @namespace Not swindlers
   *
   * */

  getNotSwindlers() {
    return this.getSheet(this.ranges.NOT_SWINDLERS, true);
  }

  /**
   *
   * @namespace Site regex
   *
   * */

  getSiteRegex() {
    return this.getSheet(this.ranges.SITE_REGEX, true);
  }

  private buildRange(column: string): string {
    return `${column}${this.sheetsStartFrom}:${column}`;
  }

  private appendRange(column: string, position: number | string) {
    return `${column}${position}`;
  }
}

export const swindlersGoogleService = new SwindlersGoogleService(localGoogleService);
