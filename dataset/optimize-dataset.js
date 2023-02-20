/* eslint-disable global-require */
const fs = require('node:fs');
const path = require('node:path');

// eslint-disable-next-line import/no-extraneous-dependencies
const stringSimilarity = require('string-similarity');

const { googleService } = require('../src/services');
const { GOOGLE_SHEETS_NAMES } = require('../src/const');
const { environmentConfig } = require('../src/config');

/**
 * @param {any[]} positives
 * @param {any[]} negatives
 * */
function processCases(positives, negatives) {
  // console.info({ positives, negatives, positivesLength: positives.length, negativesLength: negatives.length });
  const results = [];

  // Used "for" for better performance
  // It saves around 4 seconds for 12,000 * 8,000 * 2 callback calls
  for (const positive of positives) {
    const negativesMatch = [];

    for (const negative of negatives) {
      if (stringSimilarity.compareTwoStrings(positive.value || '', negative.value || '') > 0.7) {
        negativesMatch.push(negative);
      }
    }

    if (negativesMatch.length > 0) {
      results.push({ positive, negativesMatch });
      console.info({ positive, negativesMatch });

      fs.writeFileSync(path.join(__dirname, './temp/optimize-result.json'), JSON.stringify(results, null, 2));
    }
  }
}

// eslint-disable-next-line no-unused-vars
function processFromGoogle() {
  const cases = Promise.all([
    googleService.getSheet(environmentConfig.GOOGLE_SPREADSHEET_ID, GOOGLE_SHEETS_NAMES.STRATEGIC_POSITIVE),
    googleService.getSheet(environmentConfig.GOOGLE_SPREADSHEET_ID, GOOGLE_SHEETS_NAMES.STRATEGIC_NEGATIVE),
  ]);

  cases.then(([positives, negatives]) => {
    fs.writeFileSync('./positives.json', JSON.stringify(positives));
    fs.writeFileSync('./negatives.json', JSON.stringify(negatives));

    processCases(positives, negatives);
  });
}

// eslint-disable-next-line no-unused-vars
// function processFromLocal() {
//   const positivesLocal = require('../positives.json');
//   const negativesLocal = require('../negatives.json');

//   processCases(positivesLocal, negativesLocal);
// }

// googleService.removeSheetRange(env.GOOGLE_SPREADSHEET_ID, `${GOOGLE_SHEETS_NAMES.STRATEGIC_POSITIVE}!A8`).then(() => {
//   console.info('removed!');
// });

processFromGoogle();
// processFromLocal();
