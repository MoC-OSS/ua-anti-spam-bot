import { google } from 'googleapis';
import { auth } from 'google-auth-library';
import { env } from 'typed-dotenv'.config();
import { handleError } from '../utils';

const sheets = google.sheets('v4');

const RANGE = 'A7:A';
const GOOGLE_SHEET_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

export class GoogleService {
  constructor() {
    this.googleAuth();
  }

  googleAuth() {
    try {
      const keys = JSON.parse(env.GOOGLE_CREDITS);
      const client = auth.fromJSON(keys);
      client.scopes = [GOOGLE_SHEET_SCOPE];
      google.options({ auth: client });
    } catch (e: any) {
      handleError(e, `GOOGLE AUTH ERROR: ${e.message}`);
    }
  }

  /**
   * @param {string} spreadsheetId
   * @param {string} sheetName
   * @param {string} [range]
   * @param {boolean} [compact=false]
   *
   * @returns {Promise<Record<string, any>[] | null>}
   * */
  async getSheet(spreadsheetId, sheetName, range, compact = false) {
    try {
      return await sheets.spreadsheets.values
        .get({
          spreadsheetId,
          range: `${sheetName}!${range || RANGE}`,
        })
        .then((response) => {
          const shortRange = response.data.range.replace(sheetName, '').replace('!', '');
          const sheetKey = shortRange.split(':')[0].replace(/\d/g, '');
          const sheetStartFrom = +shortRange.split(':')[0].replace(/\D/g, '');

          console.info({ sheetName, sheetKey, sheetStartFrom, length: response.data.values.length });

          return (
            response.data.values
              .map((row, index) =>
                compact
                  ? row[0]
                  : {
                      value: row[0],
                      index: sheetStartFrom + index,
                      sheetKey,
                      fullPath: `${sheetName}!${sheetKey}${sheetStartFrom + index}`,
                    },
              )
              .filter((item) => (compact ? !!item : !!item.value)) || null
          );
        });
    } catch (e: any) {
      handleError(e, `GOOGLE API ERROR: ${e.message}`);
      return Promise.resolve(null);
    }
  }

  /**
   * @param {string} spreadsheetId
   * @param {string} range
   *
   * @returns {Promise< null>}
   * */
  async removeSheetRange(spreadsheetId, range) {
    try {
      return await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range,
      });
    } catch (e: any) {
      handleError(e, `GOOGLE API ERROR: ${e.message}`);
      return Promise.resolve(null);
    }
  }

  /**
   * @param {string} spreadsheetId
   * @param {string} sheetName
   * @param {string} value
   * @param {string} [range]
   * */
  async appendToSheet(spreadsheetId, sheetName, value, range) {
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!${range || RANGE}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[value]],
        },
      });
    } catch (e: any) {
      handleError(e, `GOOGLE API ERROR: ${e.message}`);
    }
  }

  /**
   * @param {string} spreadsheetId
   * @param {string} sheetName
   * @param {string[]} value
   * @param {string} [range]
   * */
  async updateSheet(spreadsheetId, sheetName, value, range) {
    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!${range || RANGE}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: value.map((item) => [item]),
        },
      });
    } catch (e: any) {
      handleError(e, `GOOGLE API ERROR: ${e.message}`);
    }
  }

  /**
   * @param {string} spreadsheetId
   * @param {string} sheetName
   * @param {string} [range]
   * */
  async clearSheet(spreadsheetId, sheetName, range) {
    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!${range || RANGE}`,
      });
    } catch (e: any) {
      handleError(e, `GOOGLE API ERROR: ${e.message}`);
    }
  }
}
export const googleService = new GoogleService();

module.exports = {
  googleService,
};
