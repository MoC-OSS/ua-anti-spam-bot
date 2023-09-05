import fs from 'node:fs';

import { removeDuplicates } from '../src/utils';

import { antisemitismDictionaryActionUrl, antisemitismDictionaryNounsUrl, antisemitismDictionaryThreadsUrl } from './dataset-antisemitism';
import { obsceneDictionaryEnUrl, obsceneDictionaryRuUrl, obsceneDictionaryUaUrl } from './dataset-obscene';

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
      .sort((a, b) => a.localeCompare(b)),
  );

filesToOptimize.forEach((url) => {
  const file = fs.readFileSync(url).toString();
  fs.writeFileSync(url, `${processDictionary(file).join('\n')}\n`);
  console.info('Optimize file:', url.pathname);
});

console.info('Done');
