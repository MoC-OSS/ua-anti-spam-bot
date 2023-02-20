import * as cld from 'cld';

import type { LanguageDetectionResult } from '../types';

export class LanguageDetectService {
  /**
   * Helper function that detects if the message in russian
   * */
  async isRussian(message: string): Promise<LanguageDetectionResult> {
    try {
      const detectResult = await this.detect(message);

      const russianDetect = detectResult.languages.find((language) => language.code === 'ru');

      if (!russianDetect) {
        return {
          result: false,
          percent: 0,
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
    return cld.detect(message);
  }
}

export const languageDetectService = new LanguageDetectService();
