const { swindlersGoogleService } = require('../src/services/swindlers-google.service');
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
    value: item.replace(urlRegexp, ' ').replace(mentionRegexp, ' '),
    label: item,
  }));

(async () => {
  const methodsMap = new Map([
    [
      'positives',
      {
        debugPath: './test-ps.json',
        getTrainData: () => swindlersGoogleService.getTrainingPositives(),
        getTestData: () => swindlersGoogleService.getTestingPositives(),
        updateTrainData: swindlersGoogleService.updateTrainingPositives,
        updateTestData: swindlersGoogleService.updateTestingPositives,
        clearTrainData: swindlersGoogleService.clearTrainingPositives(),
        clearTestData: swindlersGoogleService.clearTestingPositives(),
      },
    ],
    [
      'negatives',
      {
        debugPath: './test-ns.json',
        getTrainData: () => swindlersGoogleService.getTrainingNegatives(),
        getTestData: () => swindlersGoogleService.getTestingNegatives(),
        updateTrainData: swindlersGoogleService.updateTrainingNegatives,
        updateTestData: swindlersGoogleService.updateTestingNegatives,
        clearTrainData: swindlersGoogleService.clearTrainingNegatives(),
        clearTestData: swindlersGoogleService.clearTestingNegatives(),
      },
    ],
  ]);

  const methods = methodsMap.get(type);

  if (!methods) {
    throw new Error('Invalid type');
  }

  const [trainData, testData] = await Promise.all(
    [methods.getTrainData(), methods.getTestData()].map((promise) => promise.then(processPromise)),
  );

  const uniqueTrainSwindlers = await removeSimilar(removeDuplicates(trainData), 0.9);
  const newTrainData = uniqueTrainSwindlers
    .filter((item) => item[0].unique)
    .map((item) => item[0].first.label)
    .filter((item) => item.replace(urlRegexp, '').replace(mentionRegexp, '').trim());

  const newTestData = removeDuplicates([
    ...testData.map((item) => item.label),
    ...uniqueTrainSwindlers.filter((item) => !item[0].unique).map((item) => item[0].first.label),
  ]).filter((item) => item.replace(urlRegexp, '').replace(mentionRegexp, '').trim());

  await methods.clearTrainData();
  await methods.updateTrainData(newTrainData);

  await methods.clearTestData();
  await methods.updateTestData(newTestData);

  // const uniqueTestSwindlers = removeDuplicates(newTestData);
  // fs.writeFileSync(methods.debugPath, JSON.stringify(uniqueTestSwindlers, null, 2));
})();
