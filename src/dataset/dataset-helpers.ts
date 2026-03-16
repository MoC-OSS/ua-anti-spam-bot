import CyrillicToTranslit from 'cyrillic-to-translit-js';

import { removeDuplicates } from '@utils/remove-duplicates.util';

const translitRus = CyrillicToTranslit({ preset: 'ru' });
const translitUa = CyrillicToTranslit({ preset: 'uk' });

/**
 * Transliterates special Ukrainian characters and replaces them with Latin equivalents.
 * @param text - The input string to transform.
 * @returns The transformed string with Ukrainian-specific characters replaced.
 */
export function translitReplace(text: string): string {
  return text.replaceAll('ї', 'i').replaceAll('є', 'e').replaceAll('ґ', 'g');
}

/**
 * Expands a dataset by adding Cyrillic-to-Latin transliterations of each word.
 * @param dataset - The array of strings to process and expand with transliterations.
 * @returns A deduplicated array containing the original strings plus their transliterations.
 */
export function processMessage(dataset: string[]): string[] {
  const translitRussianDataset = dataset.map((word) => translitReplace(translitRus.transform(word, ' ')));
  const translitUkrainianDataset = dataset.map((word) => translitReplace(translitUa.transform(word, ' ')));

  return removeDuplicates([...dataset, ...translitUkrainianDataset, ...translitRussianDataset]);
}

/**
 * Splits a raw text file string into a lowercase array of non-empty lines.
 * @param dataset - The raw file content string to split and normalize.
 * @returns An array of lowercase, non-empty strings.
 */
export function processTxtMessage(dataset: string): string[] {
  return dataset.toLowerCase().split('\n').filter(Boolean);
}
