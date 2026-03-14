import fs from 'node:fs';

import { removeRepeatedLettersUtility } from '@utils/remove-repeated-letters.util';
import { SearchSet } from '@utils/search-set';

import { processMessage, processTxtMessage } from './dataset-helpers';

/**
 * Allow lists
 * */
const obsceneDictionaryTranslitWhitelist = new Set(['such', 'user', 'ept', 'derma', 'si', 'derme', 'site']);

/**
 * Urls
 * */
export const obsceneDictionaryUaUrl = new URL('strings/obscene_dictionary_ua.txt', import.meta.url);

export const obsceneDictionaryRuUrl = new URL('strings/obscene_dictionary_ru.txt', import.meta.url);

export const obsceneDictionaryEnUrl = new URL('strings/obscene_dictionary_en.txt', import.meta.url);

const obsceneDictionaryWhitelistUaUrl = new URL('strings/obscene_dictionary_ua_whitelist.txt', import.meta.url);
const obsceneDictionaryWhitelistRuUrl = new URL('strings/obscene_dictionary_ru_whitelist.txt', import.meta.url);
const obsceneDictionaryWhitelistEnUrl = new URL('strings/obscene_dictionary_en_whitelist.txt', import.meta.url);

/**
 * File allow lists
 * */
// eslint-disable-next-line security/detect-non-literal-fs-filename
const obsceneDictionaryWhitelistUa = new Set(processTxtMessage(fs.readFileSync(obsceneDictionaryWhitelistUaUrl).toString()));
// eslint-disable-next-line security/detect-non-literal-fs-filename
const obsceneDictionaryWhitelistRu = new Set(processTxtMessage(fs.readFileSync(obsceneDictionaryWhitelistRuUrl).toString()));
// eslint-disable-next-line security/detect-non-literal-fs-filename
const obsceneDictionaryWhitelistEn = new Set(processTxtMessage(fs.readFileSync(obsceneDictionaryWhitelistEnUrl).toString()));

/**
 * Logic
 * */
function processObsceneDictionary(whitelist: Set<string>, datasetUrl: URL) {
  return processMessage([
    ...whitelist,
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    ...processTxtMessage(fs.readFileSync(datasetUrl).toString())
      .filter((item) => !whitelist.has(item))
      .map((item) => removeRepeatedLettersUtility(item)),
  ]).filter((word) => !obsceneDictionaryTranslitWhitelist.has(word));
}

export const obsceneDictionary = new SearchSet([
  ...processObsceneDictionary(obsceneDictionaryWhitelistEn, obsceneDictionaryEnUrl),
  ...processObsceneDictionary(obsceneDictionaryWhitelistUa, obsceneDictionaryUaUrl),
  ...processObsceneDictionary(obsceneDictionaryWhitelistRu, obsceneDictionaryRuUrl),
]);
