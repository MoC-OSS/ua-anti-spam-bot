import fs from 'node:fs';

import { removeRepeatedLettersUtility } from '@utils/remove-repeated-letters.util';
import { SearchSet } from '@utils/search-set.util';

import { processMessage, processTxtMessage } from './dataset-helpers';

/**
 * Urls
 * */
export const antisemitismDictionaryActionUrl = new URL('strings/antisemitism_action.txt', import.meta.url);

export const antisemitismDictionaryNounsUrl = new URL('strings/antisemitism_nouns.txt', import.meta.url);

export const antisemitismDictionaryThreadsUrl = new URL('strings/antisemitism_threads.txt', import.meta.url);

/**
 * Logic
 * */
function processAntisemitismDictionary(datasetUrl: URL) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return processMessage(processTxtMessage(fs.readFileSync(datasetUrl).toString()).map((item) => removeRepeatedLettersUtility(item)));
}

export const antisemitismDictionary = {
  action: new SearchSet(processAntisemitismDictionary(antisemitismDictionaryActionUrl)),
  nouns: new SearchSet(processAntisemitismDictionary(antisemitismDictionaryNounsUrl)),
  threads: new SearchSet(processAntisemitismDictionary(antisemitismDictionaryThreadsUrl)),
};
