import fs from 'node:fs';

import {
  antisemitismDictionaryActionUrl,
  antisemitismDictionaryNounsUrl,
  antisemitismDictionaryThreadsUrl,
} from '@dataset/dataset-antisemitism';
import { obsceneDictionaryEnUrl, obsceneDictionaryRuUrl, obsceneDictionaryUaUrl } from '@dataset/dataset-obscene';

import { logger } from '@utils/logger.util';
import { removeDuplicates } from '@utils/remove-duplicates.util';

const filesToOptimize: URL[] = [
  obsceneDictionaryUaUrl,
  obsceneDictionaryRuUrl,
  obsceneDictionaryEnUrl,
  antisemitismDictionaryActionUrl,
  antisemitismDictionaryNounsUrl,
  antisemitismDictionaryThreadsUrl,
];

const processDictionary = (text: string): string[] =>
  removeDuplicates(
    text
      .toLowerCase()
      .split('\n')
      .filter(Boolean)
      .toSorted((left, right) => left.localeCompare(right)),
  );

filesToOptimize.forEach((url) => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const file = fs.readFileSync(url).toString();

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  fs.writeFileSync(url, `${processDictionary(file).join('\n')}\n`);
  logger.info(`Optimize file: ${url.pathname}`);
});

logger.info('Done');
