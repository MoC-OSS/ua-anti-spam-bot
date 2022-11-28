import { EXCEPTION_DOMAINS, URL_REGEXP, VALID_URL_REGEXP } from './constants';

export class UrlService {
  /**
   * @param {string} message - raw message from user to parse
   *
   * @returns {string[]} - parsed urls
   */
  parseUrls(message: string): string[] {
    return (message.match(URL_REGEXP) || []).filter((url) => {
      const validUrl = url.slice(0, 4) === 'http' ? url : `https://${url}`;
      try {
        const urlInstance = new URL(validUrl);
        return urlInstance && !EXCEPTION_DOMAINS.includes(urlInstance.host) && VALID_URL_REGEXP.test(validUrl);
      } catch {
        return false;
      }
    });
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
