import fs from 'node:fs';

import { cardsService } from '@services/cards.service';
import type { SwindlersCardsService } from '@services/swindlers-cards.service';
import { swindlersGoogleService } from '@services/swindlers-google.service';
import type { SwindlersUrlsService } from '@services/swindlers-urls.service';
import { urlService } from '@services/url.service';

import { logger } from '@utils/logger.util';
import { removeDuplicates } from '@utils/remove-duplicates.util';

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
  // eslint-disable-next-line sonarjs/no-clear-text-protocols
  'http://surl.li',
  'https://bit.ly',
  'telegra.ph/',
  'https://invite.viber.com',
  'https://telegra.ph/',
];

const mentionRegexp = /\B@\w+/g;

/**
 * Processes and updates the swindlers URL lists by comparing saved and fetched URLs.
 * @param swindlersUrlsService - The service for managing swindler URL lists.
 * @param savedSwindlersUrls - The previously saved swindler URLs.
 * @param swindlers - The current list of swindler message strings.
 * @returns A promise that resolves when URL processing is complete.
 */
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
       * Maps a URL to its swindler check result.
       * @param url - The URL string to process.
       * @returns A promise resolving to an object with url, urlDomain, and isSwindlerResult.
       */
      (url) => {
        const urlDomain = urlService.getUrlDomain(url);
        const validUrl = url.endsWith('/') ? url : `${url}/`;
        const isSwindler = swindlersUrlsService.isSpamUrl(validUrl);

        return isSwindler.then((isSwindlerResult) => ({ url, urlDomain, isSwindlerResult }));
      },
    );

  const swindlerUrlsCheck = await Promise.all(swindlerUrlsCheckPromises);
  const swindlersUrls = swindlerUrlsCheck.map(({ url }) => url).toSorted((left, right) => left.localeCompare(right));

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
    .toSorted((left, right) => left.localeCompare(right));

  return { notMatchedDomains, notMatchedUrls, swindlersUrls };
}

/**
 * Orchestrates the full auto-swindlers update: URLs, bots, cards, and users.
 * @param swindlersUrlsService - The service for managing swindler URL lists.
 * @param swindlersCardsService - The service for managing swindler card numbers.
 * @param swindlers - The current list of swindler message strings.
 * @param swindlersBots - The current list of known swindler bot usernames.
 * @param swindlersCards - The current list of known swindler card numbers.
 * @param swindlersUsers - The current list of known swindler user identifiers.
 * @returns A promise that resolves when the update is complete.
 */
export const autoSwindlers = async (
  swindlersUrlsService: SwindlersUrlsService,
  swindlersCardsService: SwindlersCardsService,
  swindlers: string[],
  swindlersBots: string[],
  swindlersCards: string[],
  swindlersUsers: string[],
) => {
  /**
   * Finds swindler items that match a given pattern in the messages.
   * @param items - Existing list of known swindler items.
   * @param pattern - Regex or string pattern to match against messages.
   * @returns A deduplicated array of matched swindler items.
   */
  function findSwindlersByPattern(items: string[], pattern: RegExp | string) {
    // eslint-disable-next-line sonarjs/prefer-regexp-exec
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
    .toSorted((left, right) => left.localeCompare(right))
    .filter((item) => item !== 't.me');

  const newSwindlersBots = findSwindlersByPattern(swindlersBots, mentionRegexp).filter((bot) => !swindlersUsers.includes(bot));
  const newSwindlersCards = removeDuplicates([...swindlersCards, ...swindlers.flatMap((item) => cardsService.parseCards(item))]);

  logger.info('notMatchedUrls\n');
  logger.info(notMatchedUrls.join('\n'));
  logger.info('notMatchedDomains\n');
  logger.info(notMatchedDomains.join('\n'));

  const regexpPath = new URL('../temp/regexp.txt', import.meta.url);
  const notMatchedUrlsPath = new URL('../temp/notMatchedUrls.txt', import.meta.url);
  const notMatchedDomainsPath = new URL('../temp/notMatchedDomains.txt', import.meta.url);

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  fs.writeFileSync(regexpPath, `${swindlersUrlsService.swindlersRegex.toString()}g`);
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  fs.writeFileSync(notMatchedUrlsPath, notMatchedUrls.join('\n'));
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  fs.writeFileSync(notMatchedDomainsPath, notMatchedDomains.join('\n'));

  logger.info('*** Regex update info ***');
  logger.info('https://regex101.com/');
  logger.info(`${String(regexpPath)} ${swindlersUrlsService.swindlersRegex.toString().length}`);
  logger.info(`${String(notMatchedUrlsPath)} ${notMatchedUrls.length}`);
  logger.info(`${String(notMatchedDomainsPath)} ${notMatchedDomains.length}`);

  await swindlersGoogleService.clearBots();
  await swindlersGoogleService.updateBots(newSwindlersBots);
  await swindlersGoogleService.updateDomains(swindlersDomains);
  await swindlersGoogleService.updateSites(swindlersUrls);
  await swindlersGoogleService.updateCards(newSwindlersCards);

  return {
    swindlersUrls,
  };
};
