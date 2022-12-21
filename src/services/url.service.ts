import { removeDuplicates } from '../utils';

import { EXCEPTION_DOMAINS, NON_WORD_REGEX, URL_REGEXP, VALID_URL_REGEXP } from './constants';

export class UrlService {
  /**
   * @param {string} message - raw message from user to parse
   * @param strict - is need to check in strict mode and doesn't check exception domains
   *
   * @returns {string[]} - parsed urls
   */
  parseUrls(message: string, strict = false): string[] {
    return removeDuplicates(
      (message.match(URL_REGEXP) || ([] as string[]))
        .map((url) => {
          const clearUrl = url.trim();
          const noSpecialSymbolUrl = NON_WORD_REGEX.test(clearUrl.slice(-1)) ? clearUrl.slice(0, -1) : clearUrl;
          const validUrl = noSpecialSymbolUrl.slice(0, 4) === 'http' ? noSpecialSymbolUrl : `https://${noSpecialSymbolUrl}`;

          return validUrl.slice(-1) === '/' ? validUrl.slice(0, -1) : validUrl;
        })
        .filter((url) => {
          try {
            const urlInstance = new URL(url);
            const isNotExcluded = strict ? true : !EXCEPTION_DOMAINS.includes(urlInstance.host);
            return urlInstance && isNotExcluded && VALID_URL_REGEXP.test(url);
          } catch {
            return false;
          }
        }),
    );
  }

  /**
   * @param {string} url
   * @returns {string | null}
   */
  getUrlDomain(url: string): string {
    try {
      const validUrl = url.slice(0, 4) === 'http' ? url : `https://${url}`;
      return `${new URL(validUrl).host}/`;
    } catch (error) {
      console.error('Cannot get URL domain:', url, error);
      return url;
    }
  }
}

export const urlService = new UrlService();
