const fs = require('fs');
const { env } = require('typed-dotenv').config();

const { googleService } = require('../src/services/google.service');
const { removeSimilar } = require('./remove-similar');

const [, , type] = process.argv;

function removeDuplicates(array) {
  return [...new Set(array)];
}

const mentionRegexp = /\B@\w+/g;
const urlRegexp =
  /(https?:\/\/(?:www\.|(?!www))?[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|(https?:\/\/(?:www\.|(?!www)))?[a-zA-Z0-9-]+\.[^\s]{2,}|www\.?[a-zA-Z0-9]+\.[^\s]{2,})/g;

const processPromise = (response) =>
  response.map((item) => ({
    value: item.value.replace(urlRegexp, ' ').replace(mentionRegexp, ' '),
    label: item.value,
  }));

(async () => {
  let trainData;
  let testData;
  const settings = {
    path: '',
    testRange: '',
    trainRange: '',
  };

  switch (type) {
    case 'positives': {
      settings.path = './test-ps.json';
      settings.trainRange = 'B6:B';
      settings.testRange = 'F6:F';
      [trainData, testData] = await Promise.all(
        [
          googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, settings.trainRange),
          googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, settings.testRange),
        ].map((promise) => promise.then(processPromise)),
      );

      break;
    }

    case 'negatives': {
      settings.path = './test-ns.json';
      settings.trainRange = 'A6:A';
      settings.testRange = 'E6:E';
      [trainData, testData] = await Promise.all(
        [
          googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, settings.trainRange),
          googleService.getSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, settings.testRange),
        ].map((promise) => promise.then(processPromise)),
      );
      break;
    }

    default:
      throw new Error('Invalid type');
  }

  const uniqueTrainSwindlers = await removeSimilar(trainData, 0.9);
  const newTrainData = uniqueTrainSwindlers
    .filter((item) => item[0].unique)
    .map((item) => item[0].first.label)
    .filter((item) => item.replace(urlRegexp, '').replace(mentionRegexp, '').trim());
  const newTestData = [
    ...testData.map((item) => item.label),
    ...uniqueTrainSwindlers.filter((item) => !item[0].unique).map((item) => item[0].first.label),
  ].filter((item) => item.replace(urlRegexp, '').replace(mentionRegexp, '').trim());

  const uniqueTestSwindlers = removeDuplicates(newTestData);

  await googleService.clearSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, settings.trainRange);
  await googleService.updateSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, newTrainData, settings.trainRange);

  await googleService.clearSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, settings.testRange);
  await googleService.updateSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, newTestData, settings.testRange);

  fs.writeFileSync(settings.path, JSON.stringify(uniqueTestSwindlers, null, 2));
})();
