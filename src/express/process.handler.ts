import lodashGet from 'lodash.get';
import { removeNumber, removeLatinPartialLetters, removeSpecialSymbols } from 'ukrainian-ml-optimizer';

import { messageUtil } from '../utils';
import { dataset } from '../../dataset/dataset';

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
    const processedMessage = removeNumber(removeLatinPartialLetters(removeSpecialSymbols(message))).toLowerCase();

    return words.includes(processedMessage) ? message : null;
  }
}

export const processHandler = new ProcessHandler();

module.exports = {
  processHandler,
};
