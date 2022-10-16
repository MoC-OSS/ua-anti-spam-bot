const fs = require('fs');
const path = require('path');

const { swindlersGoogleService } = require('../src/services/swindlers-google.service');

const notSwindlers = [
  '@alinaaaawwaa',
  '@all',
  '@geLIKhr25',
  '@GLORY_TO_UKRAINE_22',
  'https://redcross.org.ua/)',
  'https://www.nrc.no/countries/europe/ukraine/',
];

const startsWith = [
  'https://t.me/',
  't.me/',
  'https://hi.alfabank.ua/',
  'https://cutt.ly/',
  'http://surl.li',
  'https://bit.ly',
  'telegra.ph/',
  'https://invite.viber.com',
  'https://telegra.ph/',
];

const mentionRegexp = /\B@\w+/g;

/**
 * @template T
 * @param {T} array
 *
 * @returns {T}
 * */
function removeDuplicates(array) {
  return [...new Set(array)];
}

/**
 * @param {SwindlersUrlsService} swindlersUrlsService
 * @param {Record<string, any>[]} savedSwindlersUrls
 * @param {string[]} swindlers
 * */
async function processUrls(swindlersUrlsService, savedSwindlersUrls, swindlers) {
  /**
   * @type {string[]}
   * */
  const notMatchedDomains = [];
  const swindlerUrlsCheckPromises = removeDuplicates([
    ...savedSwindlersUrls,
    ...swindlers.map((message) => swindlersUrlsService.parseUrls(message) || []).flat(),
  ])
    .filter((url) => {
      const urlDomain = swindlersUrlsService.getUrlDomain(url);
      return !!urlDomain;
    })
    .map(
      /**
       * @param {string} url
       * */
      (url) => {
        const urlDomain = swindlersUrlsService.getUrlDomain(url);
        const validUrl = url.endsWith('/') ? url : `${url}/`;
        const isSwindler = swindlersUrlsService.isSpamUrl(validUrl);

        return isSwindler.then((isSwindlerResult) => ({ url, urlDomain, isSwindlerResult }));
      },
    );

  const swindlerUrlsCheck = await Promise.all(swindlerUrlsCheckPromises);
  const swindlersUrls = swindlerUrlsCheck.map(({ url }) => url).sort();
  const notMatchedUrls = swindlerUrlsCheck
    .filter(({ url, urlDomain, isSwindlerResult }) => {
      const isNotMatch =
        isSwindlerResult && isSwindlerResult.rate !== 200 && startsWith.every((excludeStart) => !url.startsWith(excludeStart));

      if (isNotMatch && !notMatchedDomains.includes(urlDomain)) {
        notMatchedDomains.push(urlDomain);
      }

      return isNotMatch;
    })
    .map(({ url }) => url)
    .sort();

  return { notMatchedDomains, notMatchedUrls, swindlersUrls };
}

/**
 * @param {SwindlersUrlsService} swindlersUrlsService
 * @param {SwindlersCardsService} swindlersCardsService
 * @param {string[]} swindlers
 * @param {string[]} swindlersBots
 * @param {string[]} swindlersCards
 * @param {string[]} swindlersUsers
 * */
const autoSwindlers = async (swindlersUrlsService, swindlersCardsService, swindlers, swindlersBots, swindlersCards, swindlersUsers) => {
  function findSwindlersByPattern(items, pattern) {
    return removeDuplicates([...items, ...swindlers.map((message) => message.match(pattern) || []).flat()]).filter(
      (item) => !notSwindlers.includes(item),
    );
  }

  const [savedSwindlerDomains, savedSwindlersUrls] = await Promise.all([
    swindlersGoogleService.getDomains(),
    swindlersGoogleService.getSites(),
  ]);

  const { notMatchedDomains, notMatchedUrls, swindlersUrls } = await processUrls(swindlersUrlsService, savedSwindlersUrls, swindlers);

  const swindlersDomains = removeDuplicates([...savedSwindlerDomains, ...notMatchedDomains])
    .sort()
    .filter((item) => item !== 't.me');

  const newSwindlersBots = findSwindlersByPattern(swindlersBots, mentionRegexp).filter((bot) => !swindlersUsers.includes(bot));
  const newSwindlersCards = removeDuplicates([
    ...swindlersCards,
    ...swindlers.map((item) => swindlersCardsService.parseCards(item)).flat(),
  ]);

  console.info('notMatchedUrls\n');
  console.info(notMatchedUrls.join('\n'));
  console.info('notMatchedDomains\n');
  console.info(notMatchedDomains.join('\n'));

  fs.writeFileSync(path.join(__dirname, '../temp/regexp.txt'), `${swindlersUrlsService.swindlersRegex.toString()}g`);
  fs.writeFileSync(path.join(__dirname, '../temp/notMatchedUrls.txt'), notMatchedUrls.join('\n'));
  fs.writeFileSync(path.join(__dirname, '../temp/notMatchedDomains.txt'), notMatchedDomains.join('\n'));

  await swindlersGoogleService.clearBots();
  await swindlersGoogleService.updateBots(newSwindlersBots);
  await swindlersGoogleService.updateDomains(swindlersDomains);
  await swindlersGoogleService.updateSites(swindlersUrls);
  await swindlersGoogleService.updateCards(newSwindlersCards);

  return {
    swindlersUrls,
  };
};

module.exports = {
  autoSwindlers,
};
