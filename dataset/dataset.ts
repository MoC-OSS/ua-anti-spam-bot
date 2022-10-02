/* eslint-disable camelcase */
import CyrillicToTranslit from 'cyrillic-to-translit-js';

import { removeDuplicates } from '../src/utils';

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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import swindlers_top_used from './strings/swindlers_top_used.json';

const translitRus = new CyrillicToTranslit({ preset: 'ru' });
const translitUa = new CyrillicToTranslit({ preset: 'uk' });

function processMessage(dataset: string[]): string[] {
  const translitRussianDataset = dataset.map((word) => translitRus.transform(word, ' '));
  const translitUkrainianDataset = dataset.map((word) => translitUa.transform(word, ' '));

  return removeDuplicates([...dataset, ...translitUkrainianDataset, ...translitRussianDataset]);
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
  locations: processMessage(locations),
  one_word: processMessage(one_word),
  percent_100: processMessage(percent_100),
  strict_high_risk: processMessage(strict_high_risk),
  strict_locations: processMessage(strict_locations),
  strict_percent_100: processMessage(strict_percent_100),
  swindlers_top_used,
};

/**
 * Freeze the object
 * */
Object.freeze(dataset);

console.info('*0 Dataset is ready.');
