import * as cld from 'cld';
import { removeExtraSpaces, removeSpecialSymbols } from 'ukrainian-ml-optimizer';

import type { LanguageDetectionResult } from '../types';

export class LanguageDetectService {
  readonly russianLetters = /[ъыэё]/i;

  readonly ukrainianLetters = /['єіїґ‘]/i;

  /**
   * Helper function that detects if the message in russian
   * */
  async isRussian(message: string): Promise<LanguageDetectionResult> {
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
      const detectResult = await this.detect(message);

      const russianDetect = detectResult.languages.find((language) => language.code === 'ru');

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

      return { result: russianDetect.percent > 70, percent: russianDetect.percent };
    } catch {
      /**
       * If CLD cannot find the language, it returns an error.
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

    return cld.detect(removeSpecialSymbols(clearMessage), {
      isHTML: false,
      languageHint: 'RUSSIAN',
      tldHint: 'ru',
    });
  }
}

export const languageDetectService = new LanguageDetectService();
