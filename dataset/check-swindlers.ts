import fs from 'node:fs';
import path from 'node:path';

import { initSwindlersContainer, swindlersGoogleService } from '../src/services';
import type { SwindlersResult } from '../src/types';
import { DatasetType } from '../src/types';

const type = process.argv[2] as DatasetType;

const types = [DatasetType.POSITIVES, DatasetType.NEGATIVES];

if (!types.includes(type)) {
  throw new Error(`Invalid type is passed. Expected: ${JSON.stringify(types)}`);
}

const logicMethodsMap = new Map([
  [
    DatasetType.POSITIVES,
    {
      fileName: 'check-positives-result',
      getData: () => swindlersGoogleService.getTrainingPositives(),
      checkIsInvalid: (result: SwindlersResult) => !result.isSpam,
    },
  ],
  [
    DatasetType.NEGATIVES,
    {
      fileName: 'check-negatives-result',
      getData: () => swindlersGoogleService.getTrainingNegatives(),
      checkIsInvalid: (result: SwindlersResult) => result.isSpam,
    },
  ],
]);

(async () => {
  const currentMethods = logicMethodsMap.get(type);

  if (!currentMethods) {
    throw new Error(`No methods is set for logicMethodsMap. Current Type: ${type}\nExpected: ${JSON.stringify(types)}`);
  }

  const { swindlersDetectService } = await initSwindlersContainer();

  const cases = await currentMethods.getData();

  const results = await Promise.all(
    cases.map((message) =>
      swindlersDetectService.isSwindlerMessage(message).then((result) => ({
        message,
        ...result,
      })),
    ),
  );

  const invalidCases = results.filter((item) => currentMethods.checkIsInvalid(item));
  const filePath = `./temp/${currentMethods.fileName}.json`;

  fs.writeFileSync(filePath, JSON.stringify(invalidCases, null, 2));

  console.info(`Found ${invalidCases.length} invalid cases!`);
  console.info(`Please, review this file: ${path.join(process.cwd(), filePath)}`);

  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(0);
})().catch((error) => {
  console.error('Cannot run check-swindlers. Reason:', error);
});
