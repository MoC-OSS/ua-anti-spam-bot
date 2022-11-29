/* eslint-disable unicorn/prefer-module */
import fs from 'node:fs';
import path from 'node:path';

import type { SwindlersCardsService, SwindlersUrlsService } from '../src/services';
import { swindlersGoogleService, urlService } from '../src/services';
import { removeDuplicates } from '../src/utils';

const notSwindlers = new Set([
  '@alinaaaawwaa',
  '@all',
  '@geLIKhr25',
  '@GLORY_TO_UKRAINE_22',
  'https://redcross.org.ua/)',
  'https://www.nrc.no/countries/europe/ukraine/',
]);

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
 * @param {SwindlersUrlsService} swindlersUrlsService
 * @param {Record<string, any>[]} savedSwindlersUrls
 * @param {string[]} swindlers
 * */
async function processUrls(swindlersUrlsService: SwindlersUrlsService, savedSwindlersUrls: string[], swindlers: string[]) {
  const notMatchedDomains: string[] = [];
  const swindlerUrlsCheckPromises = removeDuplicates([
    ...savedSwindlersUrls,
    ...swindlers.flatMap((message) => urlService.parseUrls(message)),
  ])
    .filter((url) => {
      const urlDomain = urlService.getUrlDomain(url);
      return !!urlDomain;
    })
    .map(
      /**
       * @param {string} url
       * */
      (url) => {
        const urlDomain = urlService.getUrlDomain(url);
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
export const autoSwindlers = async (
  swindlersUrlsService: SwindlersUrlsService,
  swindlersCardsService: SwindlersCardsService,
  swindlers: string[],
  swindlersBots: string[],
  swindlersCards: string[],
  swindlersUsers: string[],
) => {
  function findSwindlersByPattern(items: string[], pattern: string | RegExp) {
    return removeDuplicates([...items, ...swindlers.flatMap((message) => message.match(pattern) || [])]).filter(
      (item) => !notSwindlers.has(item),
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
  const newSwindlersCards = removeDuplicates([...swindlersCards, ...swindlers.flatMap((item) => swindlersCardsService.parseCards(item))]);

  console.info('notMatchedUrls\n');
  console.info(notMatchedUrls.join('\n'));
  console.info('notMatchedDomains\n');
  console.info(notMatchedDomains.join('\n'));

  const regexpPath = path.join(__dirname, '../temp/regexp.txt');
  const notMatchedUrlsPath = path.join(__dirname, '../temp/notMatchedUrls.txt');
  const notMatchedDomainsPath = path.join(__dirname, '../temp/notMatchedDomains.txt');

  fs.writeFileSync(regexpPath, `${swindlersUrlsService.swindlersRegex.toString()}g`);
  fs.writeFileSync(notMatchedUrlsPath, notMatchedUrls.join('\n'));
  fs.writeFileSync(notMatchedDomainsPath, notMatchedDomains.join('\n'));

  console.info('*** Regex update info ***');
  console.info('https://regex101.com/');
  console.info(regexpPath, swindlersUrlsService.swindlersRegex.toString().length);
  console.info(notMatchedUrlsPath, notMatchedUrls.length);
  console.info(notMatchedDomainsPath, notMatchedDomains.length);

  await swindlersGoogleService.clearBots();
  await swindlersGoogleService.updateBots(newSwindlersBots);
  await swindlersGoogleService.updateDomains(swindlersDomains);
  await swindlersGoogleService.updateSites(swindlersUrls);
  await swindlersGoogleService.updateCards(newSwindlersCards);

  return {
    swindlersUrls,
  };
};
