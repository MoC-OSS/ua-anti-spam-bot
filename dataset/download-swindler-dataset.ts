/* eslint-disable unicorn/no-process-exit */
import { initSwindlersContainer, swindlersGoogleService } from '../src/services';

import { autoSwindlers } from './auto-swindlers';
import { getSwindlersTopUsed } from './get-swindlers-top-used';

const cases = Promise.all([
  swindlersGoogleService.getTrainingPositives(),
  swindlersGoogleService.getBots(),
  swindlersGoogleService.getTestingPositives(),
  swindlersGoogleService.getCards(),
  swindlersGoogleService.getUsers(),
]);

console.info('Loading training messages...');

cases
  .then(async ([positives, newSwindlersBots, testPositives, swindlersCards, swindlersUsers]) => {
    console.info('Received training messages.');

    const { swindlersUrlsService, swindlersCardsService } = await initSwindlersContainer();

    getSwindlersTopUsed([...positives, ...testPositives]);
    await autoSwindlers(
      swindlersUrlsService,
      swindlersCardsService,
      [...positives, ...testPositives],
      newSwindlersBots,
      swindlersCards,
      swindlersUsers,
    );

    process.exit(0);
  })
  .catch((error) => {
    console.error('FATAL: Cannot get the cases. Reason:', error);
  });
