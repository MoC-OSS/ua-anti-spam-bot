const fs = require('node:fs');

// eslint-disable-next-line import/no-unresolved
const positives = require('../positives.json');
// eslint-disable-next-line import/no-unresolved
const negatives = require('../negatives.json');

const processDataset = (array) => array.map((item) => item.replace(/\n/g, ' ')).join('\n');

fs.writeFileSync('../positives.csv', processDataset(positives));
fs.writeFileSync('../negatives.csv', processDataset(negatives));

fs.renameSync('../positives.json', '../positives.old.json');
fs.renameSync('../negatives.json', '../negatives.old.json');
