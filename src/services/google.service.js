const { google } = require('googleapis');
const { auth } = require('google-auth-library');
const { env } = require('typed-dotenv').config();
const { handleError } = require('../utils');

const sheets = google.sheets('v4');

const RANGE = 'A7:A';
const GOOGLE_SHEET_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

class GoogleService {
  constructor() {
    this.googleAuth();
  }

  googleAuth() {
    try {
      const keys = JSON.parse(env.GOOGLE_CREDITS);
      const client = auth.fromJSON(keys);
      client.scopes = [GOOGLE_SHEET_SCOPE];
      google.options({ auth: client });
    } catch (e) {
      handleError(e, `GOOGLE AUTH ERROR: ${e.message}`);
    }
  }

  /**
   * @param {string} spreadsheetId
   * @param {string} sheetName
   * @param {string} value
   * */
  async appendToSheet(spreadsheetId, sheetName, value) {
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!${RANGE}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[value]],
        },
      });
    } catch (e) {
      handleError(e, `GOOGLE API ERROR: ${e.message}`);
    }
  }
}
const googleService = new GoogleService();

module.exports = {
  googleService,
};
