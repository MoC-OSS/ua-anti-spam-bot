const lodashGet = require('lodash.get');
const rules = require('../../dataset/rules.json');

class MessageUtil {
  findInText(message, searchFor) {
    return message.toLowerCase().includes(searchFor.toLowerCase());
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
