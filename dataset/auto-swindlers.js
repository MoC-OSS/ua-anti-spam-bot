const fs = require('fs');
const path = require('path');

const { urlRegexp } = require('ukrainian-ml-optimizer');

const { swindlersRegex } = require('../src/creator');
const swindlers = require('./strings/swindlers.json');
const immediately = require('./strings/immediately.json');
const swindlersBots = require('./strings/swindlers_bots.json');

const notSwindlers = [
  '@alinaaaawwaa',
  '@all',
  '@geLIKhr25',
  'GLORY_TO_UKRAINE_22',
  'https://redcross.org.ua/)',
  'https://www.nrc.no/countries/europe/ukraine/',
];

const mentionRegexp = /\B@\w+/g;

function removeDuplicates(array) {
  return [...new Set(array)];
}

function findSwindlersByPattern(items, pattern) {
  return removeDuplicates([...items, ...swindlers.map((message) => message.match(pattern) || []).flat()])
    .filter((item) => !notSwindlers.includes(item))
    .sort();
}

const newImmediately = findSwindlersByPattern(immediately, urlRegexp);
const newSwindlersBots = findSwindlersByPattern(swindlersBots, mentionRegexp);

const notMatchedUrls = newImmediately.filter((item) => urlRegexp.test(item)).filter((item) => !swindlersRegex.test(item));

console.info('notMatchedUrls\n');
console.info(notMatchedUrls.join('\n'));

fs.writeFileSync(path.join(__dirname, './strings/immediately.json'), `${JSON.stringify(newImmediately, null, 2)}\n`);
fs.writeFileSync(path.join(__dirname, './strings/swindlers_bots.json'), `${JSON.stringify(newSwindlersBots, null, 2)}\n`);
