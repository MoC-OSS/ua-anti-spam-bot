// eslint-disable-next-line import/no-unresolved
import { detectAll } from 'tinyld/heavy';
import { removeExtraSpaces, removeSpecialSymbols } from 'ukrainian-ml-optimizer';

import type { LanguageDetectionResult } from '../types';

export class LanguageDetectService {
  readonly russianLetters = /[ъыэё]/i;

  readonly ukrainianLetters = /['єіїґ‘]/i;

  /**
   * Helper function that detects if the message in russian
   * */
  isRussian(message: string): LanguageDetectionResult {
    /**
     * If the message contains russian letters, we assume that this is russian
     * */
    if (this.russianLetters.test(message)) {
      return {
        result: true,
        percent: 200,
      };
    }

    try {
      const detectResult = this.detect(message);

      const russianDetect = detectResult.find((result) => result.lang === 'ru');

      if (!russianDetect) {
        return {
          result: false,
          percent: 0,
        };
      }

      /**
       * If the message contains ukrainian letters, we assume that this is ukrainian
       * */
      if (this.ukrainianLetters.test(message)) {
        return {
          result: false,
          percent: 1,
        };
      }

      return { result: russianDetect.accuracy > 0.7, percent: russianDetect.accuracy };
    } catch {
      /**
       * If tinyld cannot find the language, it returns an error.
       * So in this case we assume that this is not russian
       * */
      return {
        result: false,
        percent: 0,
      };
    }
  }

  /**
   * Detect possible languages from the passed message.
   * If it could not decide which language is used, it throws an error
   *
   * @param message - message to get language
   * */
  detect(message: string) {
    const clearMessage = removeExtraSpaces(removeSpecialSymbols(message)).toLowerCase();

    /**
     * If the message is too short - no lang should be decided
     * */
    if (clearMessage.length < 3) {
      return [];
    }

    return detectAll(clearMessage, { only: ['uk', 'ru'] });
  }
}

export const languageDetectService = new LanguageDetectService();
