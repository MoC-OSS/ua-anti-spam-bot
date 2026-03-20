/**
 * @module google.service
 * @description Google Sheets API client for reading and writing spam detection data.
 * Manages JWT authentication and provides CRUD operations on spreadsheet ranges.
 */

import { JWT } from 'google-auth-library';
import type { JWTInput } from 'google-auth-library/build/src/auth/credentials';
import { google } from 'googleapis';

import type { SheetNames } from '@const/google-sheets.const';

import { environmentConfig } from '@shared/config';

import type { GoogleFullCellData, GoogleShortCellData } from '@app-types/google';

import { handleError } from '@utils/error-handler.util';
import { coerceArray } from '@utils/generic.util';
import { logger } from '@utils/logger.util';

const sheets = google.sheets('v4');

const RANGE = 'A7:A';
const GOOGLE_SHEET_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

export class GoogleService {
  constructor() {
    this.googleAuth();
  }

  googleAuth() {
    try {
      const keys = JSON.parse(environmentConfig.GOOGLE_CREDITS) as JWTInput;

      // Normalize the private key: replace literal \n escape sequences with actual newlines.
      // This is needed when the key is stored in .env files where JSON escape sequences
      // are not expanded by the dotenv parser.
      if (keys.private_key) {
        keys.private_key = keys.private_key.replaceAll(String.raw`\n`, '\n');
      }

      const client = new JWT({
        email: keys.client_email,
        key: keys.private_key,
        scopes: [GOOGLE_SHEET_SCOPE],
      });

      google.options({ auth: client });
    } catch (error: unknown) {
      // @ts-ignore
      handleError(error, `GOOGLE AUTH ERROR: ${error?.message as string}`);
    }
  }

  /**
   * Fetches rows from a Google Sheets range and returns them as cell data objects.
   * @param spreadsheetId - ID of the target spreadsheet
   * @param sheetName - name of the sheet tab to read
   * @param range - optional cell range (e.g. 'A7:A'); defaults to RANGE constant
   * @param compact - when true, returns flat string values instead of full cell data
   * @returns array of cell data objects or strings depending on the compact flag
   */
  async getSheet<T extends false | true = false>(
    spreadsheetId: string,
    sheetName: SheetNames,
    range?: string,
    compact?: T,
  ): Promise<T extends true ? GoogleShortCellData[] : GoogleFullCellData[]> {
    const isCompact: T = !!compact as T;

    try {
      const valueRange = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!${range || RANGE}`,
      });

      const shortRange = valueRange.data.range?.replace(sheetName, '').replace('!', '') || '';
      const sheetKey = shortRange.split(':')[0].replaceAll(/\d/g, '');
      const sheetStartFrom = +shortRange.split(':')[0].replaceAll(/\D/g, '');

      const values = valueRange.data.values as string[][] | null | undefined;

      logger.info({ sheetName, sheetKey, sheetStartFrom, length: values?.length });

      if (!values) {
        return [];
      }

      // @ts-ignore
      const preparedValues: GoogleFullCellData[] | GoogleShortCellData[] = values.map((row, index) =>
        isCompact
          ? row[0]
          : ({
              value: row[0],
              index: sheetStartFrom + index,
              sheetKey,
              fullPath: `${sheetName}!${sheetKey}${sheetStartFrom + index}`,
            } as GoogleFullCellData),
      );

      // @ts-ignore

      return preparedValues.filter((item) => (isCompact ? !!item : !!(item as GoogleFullCellData).value));
    } catch (error: unknown) {
      // @ts-expect-error
      handleError(error, `GOOGLE API ERROR: ${error?.message as string}`);

      return [];
    }
  }

  /**
   * Clears all values in the specified Google Sheets range.
   * @param spreadsheetId - ID of the target spreadsheet
   * @param range - the cell range to clear (e.g. 'Sheet1!A1:B2')
   * @returns the API response or null on error
   */
  removeSheetRange(spreadsheetId: string, range: string) {
    // eslint-disable-next-line sonarjs/no-try-promise
    try {
      return sheets.spreadsheets.values.clear({
        spreadsheetId,
        range,
      });
    } catch (error: unknown) {
      // @ts-ignore
      handleError(error, `GOOGLE API ERROR: ${error?.message as string}`);

      return null;
    }
  }

  /**
   * Appends one or more values as a new row to a Google Sheet.
   * @param spreadsheetId - ID of the target spreadsheet
   * @param sheetName - name of the sheet tab to append to
   * @param value - value or array of values to append
   * @param [range] - optional starting range for append; defaults to RANGE constant
   */
  async appendToSheet<T>(spreadsheetId: string, sheetName: SheetNames, value: T | T[], range?: string) {
    const responseData = coerceArray(value);

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!${range || RANGE}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [responseData],
        },
      });
    } catch (error: unknown) {
      // @ts-ignore
      handleError(error, `GOOGLE API ERROR: ${error?.message as string}`);
    }
  }

  /**
   * Overwrites the specified Google Sheets range with new values.
   * @param spreadsheetId - ID of the target spreadsheet
   * @param sheetName - name of the sheet tab to update
   * @param value - array of string values to write
   * @param [range] - optional cell range to overwrite; defaults to RANGE constant
   */
  async updateSheet(spreadsheetId: string, sheetName: SheetNames, value: string[], range?: string) {
    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!${range || RANGE}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: value.map((item) => [item]),
        },
      });
    } catch (error: unknown) {
      // @ts-ignore
      handleError(error, `GOOGLE API ERROR: ${error?.message as string}`);
    }
  }

  /**
   * Clears all values in a sheet, optionally within a specific range.
   * @param spreadsheetId - ID of the target spreadsheet
   * @param sheetName - name of the sheet tab to clear
   * @param [range] - optional cell range to clear; defaults to RANGE constant
   */
  async clearSheet(spreadsheetId: string, sheetName: SheetNames, range?: string) {
    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!${range || RANGE}`,
      });
    } catch (error: unknown) {
      // @ts-ignore
      handleError(error, `GOOGLE API ERROR: ${error?.message as string}`);
    }
  }
}

export const googleService = new GoogleService();
