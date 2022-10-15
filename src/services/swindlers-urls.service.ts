import type { AxiosError } from 'axios';
import axios from 'axios';
import FuzzySet from 'fuzzyset';

import type { SwindlersBaseResult, SwindlersUrlsResult } from '../types';

import { EXCEPTION_DOMAINS, SHORTS, URL_REGEXP, VALID_URL_REGEXP } from './constants';
import type { DynamicStorageService } from './dynamic-storage.service';

const harmfulUrlStart = ['https://bitly.com/a/blocked'];

export class SwindlersUrlsService {
  swindlersRegex: RegExp;

  swindlersFuzzySet!: FuzzySet;

  constructor(private dynamicStorageService: DynamicStorageService, private rate = 0.9) {
    this.swindlersRegex = this.buildSiteRegex(this.dynamicStorageService.swindlerRegexSites);
    console.info('swindlersRegex', this.swindlersRegex);
    this.initFuzzySet();
    this.dynamicStorageService.fetchEmitter.on('fetch', () => {
      this.swindlersRegex = this.buildSiteRegex(this.dynamicStorageService.swindlerRegexSites);
      console.info('swindlersRegex', this.swindlersRegex);
      this.initFuzzySet();
    });
  }

  buildSiteRegex(sites: string[]): RegExp {
    const regex = /(?:https?:\/\/)?([[eist]])(?!ua).+/;
    return new RegExp(regex.source.replace('[[sites]]', sites.join('|')));
  }

  /**
   * @description
   * Create and saves FuzzySet based on latest data from dynamic storage
   * */
  initFuzzySet() {
    this.swindlersFuzzySet = FuzzySet(this.dynamicStorageService.swindlerDomains);
  }

  /**
   * @param {string} message - raw message from user to parse
   */
  async processMessage(message: string): Promise<SwindlersBaseResult | SwindlersUrlsResult | null> {
    const urls = this.parseUrls(message);
    if (urls) {
      let lastResult: SwindlersBaseResult | SwindlersUrlsResult | null = null;
      const getUrls = urls.map((url) => this.isSpamUrl(url));
      const allUrls = await Promise.all(getUrls);
      const foundSwindlerUrl = allUrls.some((value) => {
        lastResult = value;
        return lastResult?.isSpam;
      });

      if (foundSwindlerUrl) {
        return lastResult;
      }
    }

    return null;
  }

  /**
   * @param {string} message - raw message from user to parse
   *
   * @returns {string[]}
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
    const validUrl = url.slice(0, 4) === 'http' ? url : `https://${url}`;
    return `${new URL(validUrl).host}/`;
  }

  /**
   * @param {string} url
   * @param {number} [customRate]
   */
  async isSpamUrl(url: string, customRate?: number): Promise<SwindlersBaseResult | SwindlersUrlsResult> {
    if (!url) {
      return {
        rate: 0,
        isSpam: false,
      } as SwindlersBaseResult;
    }

    /**
     * @see https://loige.co/unshorten-expand-short-urls-with-node-js/
     * */
    const redirectUrl = SHORTS.includes(this.getUrlDomain(url).slice(0, -1))
      ? await axios
          .get(url, { maxRedirects: 0 })
          .then(() => url)
          .catch(
            /**
             * @param error
             */
            (error: NodeJS.ErrnoException & AxiosError) => {
              if (error.code === 'ENOTFOUND' && error.syscall === 'getaddrinfo') {
                return url;
              }

              if (error.code === 'ECONNREFUSED' && error.syscall === 'connect') {
                return url;
              }

              if (error.code === 'ETIMEDOUT' && error.syscall === 'connect') {
                return url;
              }

              if (error.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
                return url;
              }

              if (error.code === 'ECONNRESET') {
                return url;
              }

              try {
                if (!error.response) {
                  console.error(error);
                }

                return error.response?.headers.location || error.response?.config.url || url;
              } catch (nestedError: unknown) {
                console.error(nestedError);
                return url;
              }
            },
          )
      : url;

    if (harmfulUrlStart.some((start) => redirectUrl.startsWith(start))) {
      return { isSpam: true, rate: 300 } as SwindlersBaseResult;
    }

    const domain = this.getUrlDomain(redirectUrl);
    const isRegexpMatch = this.swindlersRegex.test(domain);
    if (isRegexpMatch) {
      return { isSpam: isRegexpMatch, rate: 200 } as SwindlersBaseResult;
    }

    const [[rate, nearestName]] = this.swindlersFuzzySet.get(domain) || [[0]];

    return {
      isSpam: rate > (customRate || this.rate),
      rate,
      nearestName,
      currentName: domain,
      redirectUrl,
    } as SwindlersUrlsResult;
  }
}
