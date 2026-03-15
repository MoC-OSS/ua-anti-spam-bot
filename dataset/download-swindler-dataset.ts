/* eslint-disable unicorn/no-process-exit */
import { initSwindlersContainer } from '@services/swindlers.container';
import { swindlersGoogleService } from '@services/swindlers-google.service';

import { logger } from '@utils/logger';

import { autoSwindlers } from './auto-swindlers';
import { getSwindlersTopUsed } from './get-swindlers-top-used';

const cases = Promise.all([
  swindlersGoogleService.getTrainingPositives(),
  swindlersGoogleService.getBots(),
  swindlersGoogleService.getTestingPositives(),
  swindlersGoogleService.getCards(),
  swindlersGoogleService.getUsers(),
]);

logger.info('Loading training messages...');

cases
  .then(async ([positives, newSwindlersBots, testPositives, swindlersCards, swindlersUsers]) => {
    logger.info('Received training messages.');

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
    logger.error('FATAL: Cannot get the cases. Reason:', error);
  });
