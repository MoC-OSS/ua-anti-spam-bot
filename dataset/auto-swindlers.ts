import { filter } from 'p-iteration';
import { urlRegexp } from 'ukrainian-ml-optimizer';

import type { SwindlersCardsService, SwindlersUrlsService } from '../src/services';
import { swindlersGoogleService } from '../src/services';
import { removeDuplicates } from '../src/utils';

const notSwindlers = new Set([
  '@alinaaaawwaa',
  '@all',
  '@geLIKhr25',
  '@GLORY_TO_UKRAINE_22',
  'https://redcross.org.ua/)',
  'https://www.nrc.no/countries/europe/ukraine/',
]);

const startsWith = ['https://t.me/', 't.me/', 'https://hi.alfabank.ua/', 'https://cutt.ly/'];

const mentionRegexp = /\B@\w+/g;

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

  const notMatchedDomains: string[] = [];

  const allSwindlersUrls = removeDuplicates([
    ...savedSwindlersUrls,
    ...swindlers.flatMap((message) => swindlersUrlsService.parseUrls(message)),
  ]);

  const filteredSwindlersUrls = await filter(allSwindlersUrls, async (url) => {
    const isUrl = swindlersUrlsService.parseUrls(url);
    const isSwindler = isUrl?.length && (await swindlersUrlsService.isSpamUrl(url.endsWith('/') ? url : `${url}/`));

    if (isSwindler && !isSwindler.isSpam && !startsWith.some((excludeStart) => url.startsWith(excludeStart))) {
      notMatchedDomains.push(url);
    }

    return !!isSwindler;
  });

  const sortedSwindlersUrls = filteredSwindlersUrls.sort();

  const swindlersDomains = removeDuplicates([
    ...savedSwindlerDomains,
    ...sortedSwindlersUrls.map((url) => swindlersUrlsService.getUrlDomain(url)),
  ])
    .sort()
    .filter((item) => item !== 't.me');

  const newSwindlersBots = findSwindlersByPattern(swindlersBots, mentionRegexp).filter((bot) => !swindlersUsers.includes(bot));
  const newSwindlersCards = removeDuplicates([...swindlersCards, ...swindlers.flatMap((item) => swindlersCardsService.parseCards(item))]);

  const notMatchedUrls = sortedSwindlersUrls
    .filter((item) => urlRegexp.test(item))
    .filter((item) => !swindlersUrlsService.swindlersRegex.test(item) && !startsWith.some((excludeStart) => item.startsWith(excludeStart)));

  console.info('notMatchedUrls\n');
  console.info(notMatchedUrls.join('\n'));
  console.info('notMatchedDomains\n');
  console.info(notMatchedDomains.join('\n'));

  await swindlersGoogleService.clearBots();
  await swindlersGoogleService.updateBots(newSwindlersBots);
  await swindlersGoogleService.updateDomains(swindlersDomains);
  await swindlersGoogleService.updateSites(sortedSwindlersUrls);
  await swindlersGoogleService.updateCards(newSwindlersCards);

  return {
    swindlersUrls: sortedSwindlersUrls,
  };
};
