import { environmentConfig } from '../config';
import { GOOGLE_SHEETS_NAMES } from '../const';

import type { GoogleService } from './google.service';
import { googleService as localGoogleService } from './google.service';

export class StatisticsGoogleService {
  SHEETS_START_FROM = 'A2:A';

  constructor(private googleService: GoogleService) {}

  /**
   * @private
   * @param {string|number[]} cases
   *
   * @returns Promise<any>
   * */
  async appendToSheet(cases: (string | number)[]) {
    return this.googleService.appendToSheet(
      environmentConfig.GOOGLE_SPREADSHEET_ID,
      GOOGLE_SHEETS_NAMES.STATISTICS,
      cases,
      this.SHEETS_START_FROM,
    );
  }
}

export const statisticsGoogleService = new StatisticsGoogleService(localGoogleService);
