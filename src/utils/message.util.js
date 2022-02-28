const lodashGet = require('lodash.get');
const rules = require('../../dataset/rules.json');

class MessageUtil {
  findInText(message, searchFor) {
    return message.replace(/ /g, '').toLowerCase().includes(searchFor.toLowerCase());
  }

  isHit(andCondition, rule, message) {
    const orCondition = rule.or.some((condition) => {
      let filterText = condition;

      if (filterText.startsWith('_$')) {
        filterText = lodashGet(rules, filterText.replace('_$', ''));

        if (Array.isArray(filterText)) {
          return filterText.some((nestText) => this.findInText(message, nestText));
        }
      }

      return this.findInText(message, filterText);
    });

    return andCondition && orCondition;
  }
}

module.exports = {
  MessageUtil,
};
