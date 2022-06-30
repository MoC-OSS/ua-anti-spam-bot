const fs = require('fs');
const path = require('path');

const { swindlersGoogleService } = require('../src/services/swindlers-google.service');
const swindlersBots = require('./strings/swindlers_bots.json');
const { getSwindlersTopUsed } = require('./get-swindlers-top-used');
const { autoSwindlers } = require('./auto-swindlers');

function removeDuplicates(array) {
  return [...new Set(array)];
}

const cases = Promise.all([
  swindlersGoogleService.getTrainingPositives(),
  swindlersGoogleService.getBots(),
  swindlersGoogleService.getTestingPositives(),
]);

console.info('Loading training messages...');

cases.then(async ([positives, newSwindlersBots, testPositives]) => {
  console.info('Received training messages.');

  getSwindlersTopUsed([...positives, ...testPositives]);
  await autoSwindlers([...positives, ...testPositives]);

  fs.writeFileSync(path.join(__dirname, './strings/swindlers.json'), `${JSON.stringify(removeDuplicates(positives), null, 2)}\n`);
  fs.writeFileSync(
    path.join(__dirname, './strings/swindlers_bots.json'),
    `${JSON.stringify(removeDuplicates([...swindlersBots, ...newSwindlersBots]), null, 2)}\n`,
  );
});
