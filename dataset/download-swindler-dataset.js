const fs = require('fs');
const path = require('path');

const { env } = require('typed-dotenv').config();
const { googleService } = require('../src/services/google.service');
const swindlersBots = require('./strings/swindlers_bots.json');
const { getSwindlersTopUsed } = require('./get-swindlers-top-used');

function removeDuplicates(array) {
  return [...new Set(array)];
}

const cases = Promise.all(
  [
    googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, 'B6:B'),
    googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, 'C6:C'),
    googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, 'F6:F'),
  ].map((request) => request.then((response) => response.map((positive) => positive.value))),
);

console.info('Loading training messages...');

cases.then(([positives, newSwindlersBots, testPositives]) => {
  console.info('Received training messages.');

  getSwindlersTopUsed([...positives, ...testPositives]);

  fs.writeFileSync(path.join(__dirname, './strings/swindlers.json'), `${JSON.stringify(removeDuplicates(positives), null, 2)}\n`);
  fs.writeFileSync(
    path.join(__dirname, './strings/swindlers_bots.json'),
    `${JSON.stringify(removeDuplicates([...swindlersBots, ...newSwindlersBots]), null, 2)}\n`,
  );
});
