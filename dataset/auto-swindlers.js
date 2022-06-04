const fs = require('fs');

const { mentionRegexp, urlRegexp } = require('ukrainian-ml-optimizer');

const { swindlersRegex } = require('../src/creator');
const swindlers = require('./strings/swindlers.json');
const immediately = require('./strings/immediately.json');
const swindlersBots = require('./strings/swindlers_bots.json');

function removeDuplicates(array) {
  return [...new Set(array)];
}

function findSwindlersByPattern(items, pattern) {
  return removeDuplicates([...items, ...swindlers.map((message) => message.match(pattern) || []).flat()]).sort();
}

const newImmediately = findSwindlersByPattern(immediately, urlRegexp);
const newSwindlersBots = findSwindlersByPattern(swindlersBots, mentionRegexp);

const notMatchedUrls = newImmediately.filter((item) => urlRegexp.test(item)).filter((item) => !swindlersRegex.test(item));

console.info('notMatchedUrls\n');
console.info(notMatchedUrls.join('\n'));

fs.writeFileSync('./strings/immediately.json', JSON.stringify(newImmediately, null, 2));
fs.writeFileSync('./strings/swindlers_bots.json', JSON.stringify(newSwindlersBots, null, 2));
