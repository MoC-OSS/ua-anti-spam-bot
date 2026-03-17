/**
 * @module swindlers-google.service
 * @description Reads and writes swindler detection training data, bot lists, domains,
 * and card numbers from/to Google Sheets.
 */

import { GOOGLE_SHEETS_NAMES } from '@const/google-sheets.const';

import { environmentConfig } from '@shared/config';

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
   */

  /**
   * Fetches data from the swindlers spreadsheet for the given range.
   * @param range - range from {this.ranges}
   * @param [compact] - when true, returns flat string values instead of full cell data objects
   * @returns Promise<Record<string, any>[] | null>
   */
  getSheet<T extends false | true = true>(range: string, compact: T) {
    const isCompact = compact === undefined ? (true as T) : compact;

    return this.googleService.getSheet<T>(environmentConfig.GOOGLE_SPREADSHEET_ID, GOOGLE_SHEETS_NAMES.SWINDLERS, range, isCompact);
  }

  /**
   * Clears swindler data in the specified sheet range.
   * @param range - range from {this.ranges}
   * @returns promise resolving when the sheet range is cleared
   */
  clearSheet(range: string) {
    return this.googleService.clearSheet(environmentConfig.GOOGLE_SPREADSHEET_ID, GOOGLE_SHEETS_NAMES.SWINDLERS, range);
  }

  /**
   * Overwrites swindler data in the specified sheet range.
   * @param range - range from {this.ranges}
   * @param values - values to set
   * @returns Promise<any>
   */
  updateSheet(range: string, values: string[]) {
    return this.googleService.updateSheet(environmentConfig.GOOGLE_SPREADSHEET_ID, GOOGLE_SHEETS_NAMES.SWINDLERS, values, range);
  }

  /**
   * Appends a single value to the swindlers sheet at the given range.
   * @param range - range from {this.ranges}
   * @param value - value to append
   * @returns Promise<any>
   */
  appendToSheet(range: string, value: string) {
    return this.googleService.appendToSheet(environmentConfig.GOOGLE_SPREADSHEET_ID, GOOGLE_SHEETS_NAMES.SWINDLERS, value, range);
  }

  /**
   * Appends a value to the sheet avoiding Google Sheets append issues by clearing and rewriting.
   * @param range - range from {this.ranges}
   * @param value - value to append
   * @returns promise resolving when the sheet has been updated
   */
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
   */

  getTrainingNegatives() {
    return this.getSheet(this.ranges.TRAINING_NEGATIVES, true);
  }

  /**
   * Updates the training negative cases in the swindlers sheet.
   * @param cases - cases to update
   * @returns promise resolving when the sheet is updated
   */
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
   * Updates the training positive cases in the swindlers sheet.
   * @param cases - cases to update
   * @returns promise resolving when the sheet is updated
   */
  updateTrainingPositives(cases: string[]) {
    return this.updateSheet(this.ranges.TRAINING_POSITIVES, cases);
  }

  /**
   * Appends a single training positive case to the swindlers sheet.
   * @param singleCase - case to append
   * @returns promise resolving when the case has been appended
   */
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
   */

  getBots() {
    return this.getSheet(this.ranges.BOTS, true);
  }

  appendBot(bot: string) {
    return this.smartAppendToSheet(this.ranges.BOTS, bot);
  }

  /**
   * Overwrites the swindler bots list in the sheet.
   * @param bots - array of bot usernames to write
   * @returns promise resolving when the sheet is updated
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
   */

  getDomains() {
    return this.getSheet(this.ranges.DOMAINS, true);
  }

  /**
   * Overwrites the swindler domains list in the sheet.
   * @param domains - array of domain strings to write
   * @returns promise resolving when the sheet is updated
   */
  updateDomains(domains: string[]) {
    return this.updateSheet(this.ranges.DOMAINS, domains);
  }

  /**
   *
   * @namespace Testing cases
   */

  getTestingNegatives() {
    return this.getSheet(this.ranges.TESTING_NEGATIVES, true);
  }

  /**
   * Updates the testing negative cases in the swindlers sheet.
   * @param cases - cases to update
   * @returns promise resolving when the sheet is updated
   */
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
   * Updates the testing positive cases in the swindlers sheet.
   * @param cases - cases to update
   * @returns promise resolving when the sheet is updated
   */
  updateTestingPositives(cases: string[]) {
    return this.updateSheet(this.ranges.TESTING_POSITIVES, cases);
  }

  clearTestingPositives() {
    return this.clearSheet(this.ranges.TESTING_POSITIVES);
  }

  /**
   *
   * @namespace Sites
   */

  getSites() {
    return this.getSheet(this.ranges.SITES, true);
  }

  /**
   * Overwrites the swindler sites list in the sheet.
   * @param sites - array of site strings to write
   * @returns promise resolving when the sheet is updated
   */
  updateSites(sites: string[]) {
    return this.updateSheet(this.ranges.SITES, sites);
  }

  /**
   *
   * @namespace Users
   */

  getUsers() {
    return this.getSheet(this.ranges.USERS, true);
  }

  /**
   *
   * @namespace Cards
   */

  getCards() {
    return this.getSheet(this.ranges.CARDS, true);
  }

  /**
   * Overwrites the swindler cards list in the sheet.
   * @param cards - array of card number strings to write
   * @returns promise resolving when the sheet is updated
   */
  updateCards(cards: string[]) {
    return this.updateSheet(this.ranges.CARDS, cards);
  }

  /**
   *
   * @namespace Not swindlers
   */

  getNotSwindlers() {
    return this.getSheet(this.ranges.NOT_SWINDLERS, true);
  }

  /**
   *
   * @namespace Site regex
   */

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
