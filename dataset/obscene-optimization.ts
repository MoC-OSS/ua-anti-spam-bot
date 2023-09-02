import fs from 'node:fs';

import { removeDuplicates } from '../src/utils';

import { obsceneDictionaryEnUrl, obsceneDictionaryRuUrl, obsceneDictionaryUaUrl } from './dataset-obscene';

const obsceneDictionaryUa = fs.readFileSync(obsceneDictionaryUaUrl).toString();
const obsceneDictionaryRu = fs.readFileSync(obsceneDictionaryRuUrl).toString();
const obsceneDictionaryEn = fs.readFileSync(obsceneDictionaryEnUrl).toString();

const processDictionary = (text: string): string[] =>
  removeDuplicates(
    text
      .toLowerCase()
      .split('\n')
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b)),
  );

fs.writeFileSync(obsceneDictionaryUaUrl, `${processDictionary(obsceneDictionaryUa).join('\n')}\n`);
fs.writeFileSync(obsceneDictionaryRuUrl, `${processDictionary(obsceneDictionaryRu).join('\n')}\n`);
fs.writeFileSync(obsceneDictionaryEnUrl, `${processDictionary(obsceneDictionaryEn).join('\n')}\n`);

console.info('Done');
