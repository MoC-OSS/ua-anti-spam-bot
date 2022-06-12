const fs = require('fs');
const path = require('path');

const { env } = require('typed-dotenv').config();
const { googleService } = require('../src/services/google.service');

function removeDuplicates(array) {
  return [...new Set(array)];
}

const cases = Promise.all(
  [googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, 'B6:B')].map((request) =>
    request.then((response) => response.map((positive) => positive.value)),
  ),
);

console.info('Loading training messages...');

cases.then(([positives]) => {
  console.info('Received training messages.');

  fs.writeFileSync(path.join(__dirname, './strings/swindlers.json'), `${JSON.stringify(removeDuplicates(positives), null, 2)}\n`);
});
