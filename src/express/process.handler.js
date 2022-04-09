const lodashGet = require('lodash.get');
const { removeNumber, removeLatinPartialLetters, removeSpecialSymbols } = require('ukrainian-ml-optimizer');

const { messageUtil } = require('../utils');
const { dataset } = require('../../dataset/dataset');

class ProcessHandler {
  /**
   * @param {string} message
   * @param {string} datasetPath
   * @param {boolean} strict
   *
   * @returns {string | null}
   * */
  processHandler(message, datasetPath, strict = false) {
    /**
     * @type string[]
     * */
    const words = lodashGet(dataset, datasetPath.replace('_$', ''));

    if (datasetPath === 'one_word') {
      return this.processOneWordMessage(message, words);
    }

    const directHit = words.find((word) => messageUtil.findInText(message, word, strict));

    if (directHit) {
      return directHit;
    }

    return messageUtil.fuseInText(message, words);
  }

  /**
   * @private
   *
   * @returns {string | null}
   * */
  processOneWordMessage(message, words) {
    if (message.includes(' ')) {
      return null;
    }

    const processedMessage = removeNumber(removeLatinPartialLetters(removeSpecialSymbols(message))).toLowerCase();

    return words.includes(processedMessage) ? message : null;
  }
}

const processHandler = new ProcessHandler();

module.exports = {
  processHandler,
};
