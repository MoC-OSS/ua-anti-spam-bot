import type { AxiosError } from 'axios';
import axios from 'axios';
import FuzzySet from 'fuzzyset';

import { environmentConfig } from '../config';
import type { SwindlersBaseResult, SwindlersUrlsResult } from '../types';
import { DomainAllowList } from '../utils';

import { EXCEPTION_DOMAINS, SHORTS } from './constants';
import type { DynamicStorageService } from './dynamic-storage.service';
import { urlService } from './url.service';

const harmfulUrlStart = ['https://bitly.com/a/blocked'];

export class SwindlersUrlsService {
  swindlersRegex: RegExp;

  swindlersFuzzySet!: FuzzySet;

  domainAllowList: DomainAllowList;

  constructor(private dynamicStorageService: DynamicStorageService, private rate = 0.9) {
    this.swindlersRegex = this.buildSiteRegex(this.dynamicStorageService.swindlerRegexSites);
    console.info('swindlersRegex', this.swindlersRegex);

    this.initFuzzySet();
    this.domainAllowList = new DomainAllowList(this.dynamicStorageService.notSwindlers);

    this.dynamicStorageService.fetchEmitter.on('fetch', () => {
      this.swindlersRegex = this.buildSiteRegex(this.dynamicStorageService.swindlerRegexSites);
      this.domainAllowList.updateDomains(this.dynamicStorageService.notSwindlers);
      console.info('swindlersRegex', this.swindlersRegex);
      this.initFuzzySet();
    });
  }

  buildSiteRegex(sites: string[]): RegExp {
    // eslint-disable-next-line unicorn/better-regex
    const regex = /(?:https?:\/\/)?([[sites]])(?!ua).+/;
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
    const urls = urlService.parseUrls(message);
    if (urls.length > 0) {
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
    const redirectUrl = SHORTS.includes(urlService.getUrlDomain(url).slice(0, -1))
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

              if (error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
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

    const isUrlInException = this.domainAllowList.isAllowed(redirectUrl);

    if (isUrlInException) {
      return {
        rate: 0,
        isSpam: false,
      } as SwindlersBaseResult;
    }

    const domain = urlService.getUrlDomain(redirectUrl);

    if (EXCEPTION_DOMAINS.some((u) => domain.startsWith(u))) {
      return {
        rate: 0,
        isSpam: false,
      } as SwindlersBaseResult;
    }

    const isRegexpMatch = this.swindlersRegex.test(domain);
    if (isRegexpMatch) {
      const result = { isSpam: isRegexpMatch, rate: 200 } as SwindlersUrlsResult;
      if (environmentConfig.ENV !== 'production') {
        result.currentName = domain.match(this.swindlersRegex)?.[0] || '$error';
      }

      return result;
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
