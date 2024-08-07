/* eslint-disable camelcase */
import high_risk from './strings/high_risk.json';
import houses from './strings/houses.json';
import immediately from './strings/immediately.json';
import location_types from './strings/location_types.json';
import locations from './strings/locations.json';
import one_word from './strings/one_word.json';
import percent_100 from './strings/percent_100.json';
import strict_high_risk from './strings/strict_high_risk.json';
import strict_locations from './strings/strict_locations.json';
import strict_percent_100 from './strings/strict_percent_100.json';
import { antisemitismDictionary } from './dataset-antisemitism';
import { processMessage } from './dataset-helpers';
import { obsceneDictionary } from './dataset-obscene';

/**
 * Load optional file or fallbacks to default value
 * */
export async function loadOptionalFile<T>(path: string, defaultValue: T): Promise<T> {
  let resolvedFile = defaultValue;

  await import(path)
    .then((file) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      resolvedFile = file.default as T;
    })
    .catch(() => {
      resolvedFile = defaultValue;
    });

  return resolvedFile;
}

/**
 * Load non-existing files into dataset.
 * Should be called before any project calls
 * */
export async function loadUserbotDatasetExtras() {
  const swindlers_top_used = await loadOptionalFile<Record<string, number>>('./strings/swindlers_top_used.json', {});

  console.info('Userbot dataset extras are loaded!');

  return { swindlers_top_used };
}

/**
 * Import all datasets
 * */
console.info('*0 Initing dataset...');

export const dataset = {
  high_risk: processMessage(high_risk),
  houses: processMessage(houses),
  immediately: processMessage(immediately),
  location_types: processMessage(location_types),
  locations: processMessage(locations).map((item) => item.toLowerCase()),
  one_word: processMessage(one_word),
  percent_100: processMessage(percent_100),
  strict_high_risk: processMessage(strict_high_risk),
  strict_locations: processMessage(strict_locations),
  strict_percent_100: processMessage(strict_percent_100),
  obscene_dictionary: obsceneDictionary,
  antisemitism_dictionary: antisemitismDictionary,
};

export type DatasetKeys = keyof typeof dataset;

/**
 * Freeze the object
 * */
Object.freeze(dataset);

console.info('*0 Dataset is ready.');
