/**
 * @module url.service
 * @description Utility service for parsing and validating URLs from raw message text.
 * Handles URL normalization, deduplication, and domain extraction.
 */

import { logger } from '@utils/logger.util';
import { removeDuplicates } from '@utils/remove-duplicates.util';

import { EXCEPTION_DOMAINS, NON_WORD_REGEX, URL_REGEXP, VALID_URL_REGEXP } from './constants/swindlers-urls.constant';

export class UrlService {
  /**
   * Parses and normalizes URLs from raw message text, filtering invalid or excluded domains.
   * @param message - raw message from user to parse
   * @param strict - is need to check in strict mode and doesn't check exception domains
   * @returns - parsed urls
   */
  parseUrls(message: string, strict = false): string[] {
    return removeDuplicates(
      // eslint-disable-next-line sonarjs/prefer-regexp-exec
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
   * Extracts the domain (host + trailing slash) from a URL string.
   * @param url - URL string to extract the domain from
   * @returns the domain with trailing slash, or the original URL string on parse error
   */
  getUrlDomain(url: string): string {
    try {
      const validUrl = url.slice(0, 4) === 'http' ? url : `https://${url}`;

      return `${new URL(validUrl).host}/`;
    } catch (error) {
      logger.error({ url, err: error }, 'Cannot get URL domain:');

      return url;
    }
  }
}

export const urlService = new UrlService();
