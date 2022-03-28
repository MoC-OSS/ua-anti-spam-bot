const fs = require('fs');

// eslint-disable-next-line import/no-unresolved
const positives = require('../positives.json');
// eslint-disable-next-line import/no-unresolved
const negatives = require('../negatives.json');

fs.writeFileSync('../positives.csv', positives.join('\n'));
fs.writeFileSync('../negatives.csv', negatives.join('\n'));
