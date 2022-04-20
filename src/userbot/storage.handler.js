const diff = require('diff');
const { removeSpecialSymbols, removeExtraSpaces } = require('ukrainian-ml-optimizer');

const compareResult = {
  DIFFERENT_LENGTH: 'DIFFERENT_LENGTH',
  SAME: 'SAME',
  NOT_SAME: 'NOT_SAME',
};

const limits = {
  STORAGE: 3,
  LENGTH_RATE: 0.5,
  DIFFERENCES_RATE: 20,
};

class UserbotStorage {
  constructor() {
    this.lastMessages = [];
  }

  handleMessage(str) {
    const isUniqueText = this.isUniqueText(str);

    if (isUniqueText) {
      if (this.lastMessages.length > limits.STORAGE) {
        this.lastMessages = this.lastMessages.slice(this.lastMessages.length - limits.STORAGE + 1);
      }

      this.lastMessages.push(str);
      return true;
    }

    return false;
  }

  isUniqueText(str) {
    const isEmpty = !this.lastMessages.length;

    if (isEmpty) {
      return true;
    }

    const isStrictCompare = this.lastMessages.some((lastMessage) => lastMessage === str);

    if (isStrictCompare) {
      return false;
    }

    const isDifferent = !this.lastMessages.some((lastMessage) => this.compareText(str, lastMessage) === compareResult.SAME);

    return isDifferent;
  }

  compareText(oldStr, newStr) {
    const processStr = (str) => removeExtraSpaces(removeSpecialSymbols(str));

    const a = processStr(oldStr);
    const b = processStr(newStr);

    const lengthDifference = a.length / b.length;

    /**
     * Text bigger in 50% or less in 50%
     * */
    if (lengthDifference >= 1.0 + limits.LENGTH_RATE || lengthDifference <= limits.LENGTH_RATE) {
      return compareResult.DIFFERENT_LENGTH;
    }

    const differences = diff.diffWords(a, b);
    const differencesNumber = a.length / differences.length;

    return differencesNumber <= limits.DIFFERENCES_RATE ? compareResult.NOT_SAME : compareResult.SAME;
  }
}

const userbotStorage = new UserbotStorage();

module.exports = {
  userbotStorage,
};
