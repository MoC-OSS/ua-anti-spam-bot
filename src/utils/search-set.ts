/**
 * Search set for efficient word searches.
 */
import { removeSpecialSymbols } from 'ukrainian-ml-optimizer';

import { removeDuplicates } from './remove-duplicates.util';
import { removeRepeatedLettersUtil } from './remove-repeated-letters.util';

export interface SearchSetResult {
  found: string;
  origin: string;
  wordIndex: number;
}

export class SearchSet extends Set {
  search(string: string): SearchSetResult | null {
    /**
     * Optimizes the input string for searching by converting to lowercase, removing punctuation,
     * and normalizing white spaces.
     */
    const optimizedString = removeSpecialSymbols(string.toLowerCase()).replace(/\s\s+/g, ' ').trim();
    const trimmedString = removeRepeatedLettersUtil(optimizedString);

    const words = optimizedString.split(' ');
    const trimmedWords = trimmedString.split(' ');

    let foundWordIndex = -1;
    const foundWord = removeDuplicates([...trimmedWords, ...words]).find((word, index) => {
      if (this.has(word)) {
        foundWordIndex = index;
        return true;
      }

      return false;
    });

    if (foundWord) {
      return {
        found: foundWord,
        origin: words[foundWordIndex] || foundWord,
        wordIndex: foundWordIndex,
      };
    }

    return null;
  }
}
