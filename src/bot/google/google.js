const path = require('path');
const { google } = require('googleapis');

const sheets = google.sheets('v4');
const { handleError } = require('../../utils');

const RANGE = 'A7:A';
const GOOGLE_SHEET_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

/**
 * @param {string} spreadsheetId
 * @param {string} sheetName
 * @param {string} value
 * */
const appendToSheet = async (spreadsheetId, sheetName, value) => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, './../../../creds.json'),
      scopes: [GOOGLE_SHEET_SCOPE],
    });
    google.options({ auth });
    return await sheets.spreadsheets.values.append({
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
};

module.exports = {
  appendToSheet,
};
