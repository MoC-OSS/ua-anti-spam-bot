const fs = require('node:fs');

// eslint-disable-next-line import/no-unresolved
const truePositives = require('./cases/true-positives.json');
// eslint-disable-next-line import/no-unresolved
const trueNegative = require('./cases/true-negatives.json');

const csvFileRows = ['commenttext,spam'];

function processDatasetCase(item) {
  return item
    .replace(/[^\da-z\u0400-\u04FF]/gi, ' ')
    .replace(/\s\s+/g, ' ')
    .trim();
}

const truePositivesRows = truePositives.map(processDatasetCase).map((item) => `${item},true`);
const trueNegativeRows = trueNegative.map(processDatasetCase).map((item) => `${item},false`);

const wordsCount = [...truePositivesRows, ...trueNegativeRows].map((word) => word.split(' ').length).sort((a, b) => b - a);

fs.writeFileSync('./temp/tensor-csv-dataset.stats.txt', wordsCount.join('\n'));
fs.writeFileSync('./temp/tensor-csv-dataset.csv', [...csvFileRows, ...truePositivesRows, ...trueNegativeRows].join('\n'));
