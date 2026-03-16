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
   * @param message - The message text to check.
   * @param datasetPath - The dataset key identifying which word list to use.
   * @param strict - When true, requires an exact match instead of fuzzy matching.
   * @returns The matched keyword string, or null if no match is found.
   */
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
   * @param message - The single-word message text to check.
   * @param words - The array of words to match against.
   * @returns The original message if matched, or null if not found.
   */
  processOneWordMessage(message: string, words: string[]) {
    const processedMessage = removeNumber(removeLatinPartialLetters(removeSpecialSymbols(message))).toLowerCase();

    return words.includes(processedMessage) ? message : null;
  }
}

export const processHandler = new ProcessHandler();
