const fs = require('fs');

// eslint-disable-next-line import/no-unresolved
const phrases = require('./cases/true-negatives.json');
// const phrases = require('./cases/true-positives.json');
// eslint-disable-next-line import/no-unresolved
const parsedPhrases = require('./temp/parse.json');

const newPhrases = [...parsedPhrases, ...phrases];

fs.writeFileSync('./cases/true-negatives.json', `${JSON.stringify(newPhrases, null, 2)}\n`);
// fs.writeFileSync('./cases/true-positives.json', `${JSON.stringify(newPhrases, null, 2)}\n`);
