/**
 * @module statistics-google.service
 * @description Writes bot feature-toggle statistics to Google Sheets for reporting.
 */

import { GOOGLE_SHEETS_NAMES } from '@const/google-sheets.const';

import { environmentConfig } from '../config';

import type { GoogleService } from './google.service';
import { googleService as localGoogleService } from './google.service';

export class StatisticsGoogleService {
  sheetsStartFrom = 'A2:A';

  constructor(private googleService: GoogleService) {}

  /**
   * @private
   * @param {string|number[]} cases
   *
   * @returns Promise<any>
   * */
  async appendToSheet(cases: (number | string)[]) {
    return this.googleService.appendToSheet(
      environmentConfig.GOOGLE_SPREADSHEET_ID,
      GOOGLE_SHEETS_NAMES.STATISTICS,
      cases,
      this.sheetsStartFrom,
    );
  }
}

export const statisticsGoogleService = new StatisticsGoogleService(localGoogleService);
