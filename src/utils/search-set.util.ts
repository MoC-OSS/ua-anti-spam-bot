/**
 * Search set for efficient word searches.
 */
import { removeSpecialSymbols } from 'ukrainian-ml-optimizer';

import { removeDuplicates } from './remove-duplicates.util';
import { removeRepeatedLettersUtility } from './remove-repeated-letters.util';

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
  /**
   * Tokenizes and normalizes the input string for efficient keyword searching.
   * */
  tokenize(string: string): SearchSetTokens {
    const optimizedString = removeSpecialSymbols(string.toLowerCase()).replaceAll(/\s\s+/g, ' ').trim();
    const trimmedString = removeRepeatedLettersUtility(optimizedString);

    const words = optimizedString.split(' ');
    const trimmedWords = trimmedString.split(' ');

    const twoWords = words.map((word, index) => `${word} ${words[index + 1] || ''}`.trim());

    const wordsToSearch = removeDuplicates([...trimmedWords, ...words, ...twoWords]);

    return { wordsToSearch, words };
  }

  /**
   * Searches the set for any matching token and returns the first match with its origin word.
   * */
  search(string: SearchSetTokens | string): SearchSetResult | null {
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
        // eslint-disable-next-line security/detect-object-injection
        origin: words[foundWordIndex] || foundWord,
        wordIndex: foundWordIndex,
      };
    }

    return null;
  }
}
