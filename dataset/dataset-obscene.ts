import fs from 'node:fs';

import { removeRepeatedLettersUtil, SearchSet } from '../src/utils';

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
const obsceneDictionaryWhitelistUa = new Set(processTxtMessage(fs.readFileSync(obsceneDictionaryWhitelistUaUrl).toString()));
const obsceneDictionaryWhitelistRu = new Set(processTxtMessage(fs.readFileSync(obsceneDictionaryWhitelistRuUrl).toString()));
const obsceneDictionaryWhitelistEn = new Set(processTxtMessage(fs.readFileSync(obsceneDictionaryWhitelistEnUrl).toString()));

/**
 * Logic
 * */
function processObsceneDictionary(whitelist: Set<string>, datasetUrl: URL) {
  return processMessage([
    ...whitelist,
    ...processTxtMessage(fs.readFileSync(datasetUrl).toString())
      .filter((item) => !whitelist.has(item))
      .map((item) => removeRepeatedLettersUtil(item)),
  ]).filter((word) => !obsceneDictionaryTranslitWhitelist.has(word));
}

export const obsceneDictionary = new SearchSet([
  ...processObsceneDictionary(obsceneDictionaryWhitelistEn, obsceneDictionaryEnUrl),
  ...processObsceneDictionary(obsceneDictionaryWhitelistUa, obsceneDictionaryUaUrl),
  ...processObsceneDictionary(obsceneDictionaryWhitelistRu, obsceneDictionaryRuUrl),
]);
