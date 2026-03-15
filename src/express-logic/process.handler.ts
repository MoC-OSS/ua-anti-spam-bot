import { removeLatinPartialLetters, removeNumber, removeSpecialSymbols } from 'ukrainian-ml-optimizer';

import { messageUtility } from '@utils/util-instances.util';

import type { DatasetKeys } from '../../dataset/dataset';
import { dataset } from '../../dataset/dataset';

class ProcessHandler {
  /**
   * @param {string} message
   * @param {DatasetKeys} datasetPath
   * @param {boolean} strict
   *
   * @returns {string | null}
   * */
  processHandler(message: string, datasetPath: DatasetKeys, strict = false) {
    const words = dataset[datasetPath.replace('_$', '') as DatasetKeys] as string[];

    if (datasetPath === 'one_word') {
      return this.processOneWordMessage(message, words);
    }

    const directHit = words.find((word) => messageUtility.findInText(message, word, strict));

    if (directHit) {
      return directHit;
    }

    return messageUtility.fuseInText(message, words);
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
