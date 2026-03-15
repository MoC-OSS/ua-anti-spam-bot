/**
 * @module process.handler
 * @description Handles message classification against dataset keyword lists.
 * Supports single-word, multi-word, and full-text fuzzy matching.
 */

import { removeLatinPartialLetters, removeNumber, removeSpecialSymbols } from 'ukrainian-ml-optimizer';

import type { DatasetKeys } from '@dataset/dataset';
import { dataset } from '@dataset/dataset';

import { messageUtility } from '@utils/util-instances.util';

class ProcessHandler {
  /**
   * Matches a message against a dataset keyword list using fuzzy or strict matching.
   *
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
   * Matches a single-word message against the dataset word list.
   *
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
