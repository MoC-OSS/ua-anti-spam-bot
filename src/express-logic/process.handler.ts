import lodashGet from 'lodash.get';
import { removeLatinPartialLetters, removeNumber, removeSpecialSymbols } from 'ukrainian-ml-optimizer';

import { dataset } from '../../dataset/dataset';
import { messageUtil } from '../utils';

class ProcessHandler {
  /**
   * @param {string} message
   * @param {string} datasetPath
   * @param {boolean} strict
   *
   * @returns {string | null}
   * */
  processHandler(message: string, datasetPath: string, strict = false) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const words = lodashGet(dataset, datasetPath.replace('_$', '')) as string[];

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
  processOneWordMessage(message: string, words: string[]) {
    const processedMessage = removeNumber(removeLatinPartialLetters(removeSpecialSymbols(message))).toLowerCase();

    return words.includes(processedMessage) ? message : null;
  }
}

export const processHandler = new ProcessHandler();
