const lodashGet = require('lodash.get');
const CyrillicToTranslit = require('cyrillic-to-translit-js');
const Fuse = require('fuse.js');

const rules = require('../../dataset/rules.json');

const cyrillicToTranslit = new CyrillicToTranslit();

const options = {
  shouldSort: true,
  threshold: 0.15,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 6,
};

class MessageUtil {
  findInText(message, searchFor) {
    /**
     * Direct hit
     * */
    let directHit = false;

    if (searchFor <= 4) {
      directHit = message.toLowerCase().includes(searchFor.toLowerCase());
    }

    if (directHit) {
      return true;
    }

    /**
     * Translit hit
     * */
    const translitHit = cyrillicToTranslit
      .transform(message, ' ')
      .toLowerCase()
      .includes(cyrillicToTranslit.transform(searchFor, ' ').toLowerCase());

    if (translitHit) {
      return true;
    }

    /**
     * Fuse hit
     * */
    const fuseInstanse = new Fuse([message.toLowerCase()], options);
    const fuseHit = fuseInstanse.search(searchFor.toLowerCase());

    return !!fuseHit.length;
  }

  isHit(andCondition, rule, message) {
    let findText = '';

    const orCondition = rule.or.find((condition) => {
      let filterText = condition;

      if (filterText.startsWith('_$')) {
        filterText = lodashGet(rules, filterText.replace('_$', ''));

        if (Array.isArray(filterText)) {
          const da3 = filterText.some((nestText) => {
            const da4 = this.findInText(message, nestText);

            if (da4) {
              findText = nestText;
              return da4;
            }

            return false;
          });

          return da3;
        }
      }

      const da2 = this.findInText(message, filterText);

      if (da2) {
        findText = filterText;
        return da2;
      }

      return false;
    });

    return { result: andCondition && orCondition, findText };
  }
}

module.exports = {
  MessageUtil,
};
