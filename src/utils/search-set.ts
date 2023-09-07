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

export interface SearchSetTokens {
  words: string[];
  wordsToSearch: string[];
}

export class SearchSet extends Set {
  tokenize(string: string): SearchSetTokens {
    /**
     * Optimizes the input string for searching by converting to lowercase, removing punctuation,
     * and normalizing white spaces.
     */
    const optimizedString = removeSpecialSymbols(string.toLowerCase()).replace(/\s\s+/g, ' ').trim();
    const trimmedString = removeRepeatedLettersUtil(optimizedString);

    const words = optimizedString.split(' ');
    const trimmedWords = trimmedString.split(' ');

    const twoWords = words.map((word, index) => `${word} ${words[index + 1] || ''}`.trim());

    const wordsToSearch = removeDuplicates([...trimmedWords, ...words, ...twoWords]);

    return { wordsToSearch, words };
  }

  search(string: string | SearchSetTokens): SearchSetResult | null {
    const { wordsToSearch, words } = (string as SearchSetTokens).wordsToSearch
      ? (string as SearchSetTokens)
      : this.tokenize(string as string);

    let foundWordIndex = -1;
    const foundWord = wordsToSearch.find((word, index) => {
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
