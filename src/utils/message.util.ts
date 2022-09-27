// const CyrillicToTranslit = require('cyrillic-to-translit-js');
import Fuse from 'fuse.js';

// const cyrillicToTranslit = new CyrillicToTranslit();

const options = {
  shouldSort: true,
  threshold: 0.1,
  location: 0,
  distance: 100000,
  maxPatternLength: 32,
  minMatchCharLength: 6,
};

class MessageUtil {
  findInText(message, searchFor, strict = false) {
    /**
     * Direct hit
     * */
    let directHit = false;

    if (searchFor.length <= 4) {
      if (strict) {
        directHit = message
          .replace(/[^a-z\u0400-\u04FF\d]/gi, ' ')
          .replace(/\s\s+/g, ' ')
          .split(' ')
          .find((word) => word.toLowerCase() === searchFor.toLowerCase());
      } else {
        directHit = message.toLowerCase().includes(searchFor.toLowerCase());
      }

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
  fuseInText(message, wordsArray) {
    /**
     * Fuse hit
     * */
    const fuseInstance = new Fuse([message], options);

    return wordsArray.find((word) => !!fuseInstance.search(word).length) || null;
  }
}

module.exports = {
  MessageUtil,
};
