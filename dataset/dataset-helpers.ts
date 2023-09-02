import CyrillicToTranslit from 'cyrillic-to-translit-js';

import { removeDuplicates } from '../src/utils/remove-duplicates.util';

const translitRus = CyrillicToTranslit({ preset: 'ru' });
const translitUa = CyrillicToTranslit({ preset: 'uk' });

export function translitReplace(text: string): string {
  return text.replace(/ї/g, 'i').replace(/є/g, 'e').replace(/ґ/g, 'g');
}

export function processMessage(dataset: string[]): string[] {
  const translitRussianDataset = dataset.map((word) => translitReplace(translitRus.transform(word, ' ')));
  const translitUkrainianDataset = dataset.map((word) => translitReplace(translitUa.transform(word, ' ')));

  return removeDuplicates([...dataset, ...translitUkrainianDataset, ...translitRussianDataset]);
}

export function processTxtMessage(dataset: string): string[] {
  return dataset.toLowerCase().split('\n').slice(1).filter(Boolean);
}
