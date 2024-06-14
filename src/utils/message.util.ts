// const CyrillicToTranslit = require('cyrillic-to-translit-js');
import Fuse from 'fuse.js';

// const cyrillicToTranslit = new CyrillicToTranslit();

const options = {
  shouldSort: true,
  threshold: 0.1,
  location: 0,
  distance: 100_000,
  maxPatternLength: 32,
  minMatchCharLength: 6,
};

export class MessageUtil {
  findInText(message: string, searchFor: string, strict = false) {
    /**
     * Direct hit
     * */
    let directHit: string | boolean = false;

    if (searchFor.length <= 4) {
      directHit = strict
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
