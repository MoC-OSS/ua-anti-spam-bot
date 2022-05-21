/* eslint-disable global-require */
const fs = require('fs');

const { env } = require('typed-dotenv').config();
// eslint-disable-next-line import/no-extraneous-dependencies
const stringSimilarity = require('string-similarity');

const { googleService } = require('../src/services/google.service');

/**
 * @param {any[]} positives
 * @param {any[]} negatives
 * */
function processCases(positives, negatives) {
  // console.info({ positives, negatives, positivesLength: positives.length, negativesLength: negatives.length });

  // Used "for" for better performance
  // It saves around 4 seconds for 12,000 * 8,000 * 2 callback calls
  for (let positiveIndex = 0; positiveIndex < positives.length; positiveIndex += 1) {
    const positive = positives[positiveIndex];
    const negativesMatch = [];

    for (let negativeIndex = 0; negativeIndex < negatives.length; negativeIndex += 1) {
      const negative = negatives[negativeIndex];
      if (stringSimilarity.compareTwoStrings(positive.value || '', negative.value || '') > 0.7) {
        negativesMatch.push(negative);
      }
    }

    if (negativesMatch.length) {
      console.info({ positive, negativesMatch });
    }
  }
}

// eslint-disable-next-line no-unused-vars
function processFromGoogle() {
  const cases = Promise.all([
    googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_POSITIVE_SHEET_NAME),
    googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_NEGATIVE_SHEET_NAME),
  ]);

  cases.then(([positives, negatives]) => {
    fs.writeFileSync('./positives.json', JSON.stringify(positives));
    fs.writeFileSync('./negatives.json', JSON.stringify(negatives));

    processCases(positives, negatives);
  });
}

// eslint-disable-next-line no-unused-vars
function processFromLocal() {
  const positivesLocal = require('../positives.json');
  const negativesLocal = require('../negatives.json');

  processCases(positivesLocal, negativesLocal);
}

processFromGoogle();
// processFromLocal();
