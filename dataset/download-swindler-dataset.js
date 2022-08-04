const { swindlersGoogleService } = require('../src/services/swindlers-google.service');
const { getSwindlersTopUsed } = require('./get-swindlers-top-used');
const { autoSwindlers } = require('./auto-swindlers');
const { initSwindlersContainer } = require('../src/services/swindlers.container');

const cases = Promise.all([
  swindlersGoogleService.getTrainingPositives(),
  swindlersGoogleService.getBots(),
  swindlersGoogleService.getTestingPositives(),
  swindlersGoogleService.getCards(),
  swindlersGoogleService.getUsers(),
]);

console.info('Loading training messages...');

cases.then(async ([positives, newSwindlersBots, testPositives, swindlersCards, swindlersUsers]) => {
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
});
