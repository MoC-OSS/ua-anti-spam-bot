const fs = require('fs');

const positives = require('../positives.json');
const negatives = require('../negatives.json');

fs.writeFileSync('../positives.csv', positives.join('\n'));
fs.writeFileSync('../negatives.csv', negatives.join('\n'));
