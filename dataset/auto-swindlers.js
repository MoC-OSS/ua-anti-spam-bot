const fs = require('fs');
const path = require('path');

const { env } = require('typed-dotenv').config();
const { urlRegexp } = require('ukrainian-ml-optimizer');

const { swindlersRegex } = require('../src/creator');
const swindlers = require('./strings/swindlers.json');
const immediately = require('./strings/immediately.json');
const swindlersBots = require('./strings/swindlers_bots.json');
const { SwindlersUrlsService } = require('../src/services/swindlers-urls.service');
const { googleService } = require('../src/services/google.service');

const swindlersUrlsService = new SwindlersUrlsService();

const notSwindlers = [
  '@alinaaaawwaa',
  '@all',
  '@geLIKhr25',
  '@GLORY_TO_UKRAINE_22',
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

(async () => {
  const [savedSwindlerDomains, savedSwindlersUrls] = await Promise.all(
    [
      googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, 'D6:D'),
      googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, 'G6:G'),
    ].map((request) => request.then((response) => response.map((positive) => positive.value))),
  );

  const notMatchedDomains = [];
  const swindlersUrls = removeDuplicates([
    ...savedSwindlersUrls,
    ...swindlers.map((message) => swindlersUrlsService.parseUrls(message)).flat(),
  ])
    .filter((url) => {
      const isSwindler = swindlersUrlsService.isSpamUrl(`${url}/`);

      if (!isSwindler.isSpam) {
        notMatchedDomains.push(url);
      }

      return isSwindler;
    })
    .sort();

  const swindlersDomains = removeDuplicates([
    ...savedSwindlerDomains,
    ...swindlersUrls.map((url) => swindlersUrlsService.getUrlDomain(url)),
  ]).sort();

  fs.writeFileSync(path.join(__dirname, './temp/swindlers_domains.txt'), swindlersDomains.join('\n'));
  fs.writeFileSync(path.join(__dirname, './temp/swindlers_url.txt'), swindlersUrls.join('\n'));

  const newImmediately = findSwindlersByPattern(immediately, urlRegexp);
  const newSwindlersBots = findSwindlersByPattern(swindlersBots, mentionRegexp);

  const notMatchedUrls = newImmediately.filter((item) => urlRegexp.test(item)).filter((item) => !swindlersRegex.test(item));

  console.info('notMatchedUrls\n');
  console.info(notMatchedUrls.join('\n'));
  console.info('notMatchedDomains\n');
  console.info(notMatchedDomains.join('\n'));

  fs.writeFileSync(path.join(__dirname, './strings/immediately.json'), `${JSON.stringify(newImmediately, null, 2)}\n`);
  fs.writeFileSync(path.join(__dirname, './strings/swindlers_bots.json'), `${JSON.stringify(newSwindlersBots, null, 2)}\n`);
})();
