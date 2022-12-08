import { swindlersGoogleService } from '../src/services';
import { removeDuplicates } from '../src/utils';

import { removeSimilar } from './remove-similar';

const type = process.argv[2];

const mentionRegexp = /\B@\w+/g;
const urlRegexp =
  /(https?:\/\/(?:www\.|(?!www))?[\dA-Za-z][\dA-Za-z-]+[\dA-Za-z]\.\S{2,}|www\.[\dA-Za-z][\dA-Za-z-]+[\dA-Za-z]\.\S{2,}|(https?:\/\/(?:www\.|(?!www)))?[\dA-Za-z-]+\.\S{2,}|www\.?[\dA-Za-z]+\.\S{2,})/g;

const processPromise = (response: string[]) =>
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
        updateTrainData: swindlersGoogleService.updateTrainingPositives.bind(swindlersGoogleService),
        updateTestData: swindlersGoogleService.updateTestingPositives.bind(swindlersGoogleService),
        clearTrainData: swindlersGoogleService.clearTrainingPositives.bind(swindlersGoogleService),
        clearTestData: swindlersGoogleService.clearTestingPositives.bind(swindlersGoogleService),
      },
    ],
    [
      'negatives',
      {
        debugPath: './test-ns.json',
        getTrainData: () => swindlersGoogleService.getTrainingNegatives(),
        getTestData: () => swindlersGoogleService.getTestingNegatives(),
        updateTrainData: swindlersGoogleService.updateTrainingNegatives.bind(swindlersGoogleService),
        updateTestData: swindlersGoogleService.updateTestingNegatives.bind(swindlersGoogleService),
        clearTrainData: swindlersGoogleService.clearTrainingNegatives.bind(swindlersGoogleService),
        clearTestData: swindlersGoogleService.clearTestingNegatives.bind(swindlersGoogleService),
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

  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(0);
})().catch((error) => {
  console.error('FATAL: Cannot optimize dataset. Reason:', error);
  throw error;
});
