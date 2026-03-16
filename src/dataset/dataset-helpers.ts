import CyrillicToTranslit from 'cyrillic-to-translit-js';

import { removeDuplicates } from '@utils/remove-duplicates.util';

const translitRus = CyrillicToTranslit({ preset: 'ru' });
const translitUa = CyrillicToTranslit({ preset: 'uk' });

/**
 *
 * @param text
 */
export function translitReplace(text: string): string {
  return text.replaceAll('ї', 'i').replaceAll('є', 'e').replaceAll('ґ', 'g');
}

/**
 *
 * @param dataset
 */
export function processMessage(dataset: string[]): string[] {
  const translitRussianDataset = dataset.map((word) => translitReplace(translitRus.transform(word, ' ')));
  const translitUkrainianDataset = dataset.map((word) => translitReplace(translitUa.transform(word, ' ')));

  return removeDuplicates([...dataset, ...translitUkrainianDataset, ...translitRussianDataset]);
}

/**
 *
 * @param dataset
 */
export function processTxtMessage(dataset: string): string[] {
  return dataset.toLowerCase().split('\n').filter(Boolean);
}
