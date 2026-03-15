/**
 * @module message.util
 * @description Utility class for fuzzy text matching in messages using Fuse.js.
 * Supports both strict (exact word match) and loose (substring) matching modes.
 */

import Fuse from 'fuse.js';

const options = {
  shouldSort: true,
  threshold: 0.1,
  location: 0,
  distance: 100_000,
  maxPatternLength: 32,
  minMatchCharLength: 6,
};

export class MessageUtility {
  /**
   * Searches for a keyword in the message text using direct or fuzzy matching.
   * */
  // eslint-disable-next-line sonarjs/function-return-type
  findInText(message: string, searchFor: string, strict = false) {
    /**
     * Direct hit
     * */
    if (searchFor.length <= 4) {
      const directHit = strict
        ? message
            .replaceAll(/[^\da-z\u0400-\u04FF]/gi, ' ')
            .replaceAll(/\s\s+/g, ' ')
            .split(' ')
            .find((word) => word.toLowerCase() === searchFor.toLowerCase()) || false
        : message.toLowerCase().includes(searchFor.toLowerCase());

      return directHit;
    }

    /**
     * Translit hit
     * */
    // const translitHit = cyrillicToTranslit
    //   .transform(message, ' ')
    //   .toLowerCase()
    //   .includes(cyrillicToTranslit.transform(searchFor, ' ').toLowerCase());
    //
    // if (translitHit) {
    //   return true;
    // }

    /**
     * Contains search
     * */
    // return message.toLowerCase().includes(searchFor.toLowerCase());
    return false;
  }

  /**
   * Performs a fuzzy search for any of the given words within the message using Fuse.js.
   *
   * @param {string} message
   * @param {string[]} wordsArray
   *
   * @returns {string | null}
   * */
  fuseInText(message: string, wordsArray: string[]) {
    /**
     * Fuse hit
     * */
    const fuseInstance = new Fuse([message], options);

    return wordsArray.find((word) => fuseInstance.search(word).length > 0) || null;
  }
}
