const { swindlersGoogleService } = require('../src/services/swindlers-google.service');
const { getSwindlersTopUsed } = require('./get-swindlers-top-used');
const { autoSwindlers } = require('./auto-swindlers');

const cases = Promise.all([
  swindlersGoogleService.getTrainingPositives(),
  swindlersGoogleService.getBots(),
  swindlersGoogleService.getTestingPositives(),
]);

console.info('Loading training messages...');

cases.then(async ([positives, newSwindlersBots, testPositives]) => {
  console.info('Received training messages.');

  getSwindlersTopUsed([...positives, ...testPositives]);
  await autoSwindlers([...positives, ...testPositives], newSwindlersBots);
});
