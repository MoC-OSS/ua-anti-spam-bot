const fs = require('fs');

const { mentionRegexp, urlRegexp } = require('ukrainian-ml-optimizer');

const { swindlersRegex } = require('../src/creator');
const swindlers = require('./strings/swindlers.json');
const immediately = require('./strings/immediately.json');

function removeDuplicates(array) {
  return [...new Set(array)];
}

const swindlersAccountsAndUrls = removeDuplicates(
  swindlers.map((message) => [...(message.match(mentionRegexp) || []), ...(message.match(urlRegexp) || [])]).flat(),
).sort();

const newImmediately = removeDuplicates([...immediately, ...swindlersAccountsAndUrls]).sort();

const notMatchedUrls = newImmediately.filter((item) => urlRegexp.test(item)).filter((item) => !swindlersRegex.test(item));

console.info('notMatchedUrls\n');
console.info(notMatchedUrls.join('\n'));

fs.writeFileSync('./strings/immediately.json', JSON.stringify(newImmediately, null, 2));
