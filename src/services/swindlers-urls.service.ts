/**
 * @module swindlers-urls.service
 * @description Detects swindler URLs in messages using domain fuzzy matching,
 * regex patterns, URL redirect resolution, and an allow-list.
 */

import type { AxiosError } from 'axios';
import axios from 'axios';
import FuzzySet from 'fuzzyset';

import { environmentConfig } from '@shared/config';

import type { SwindlersBaseResult, SwindlersUrlsResult } from '@app-types/swindlers';

import { DomainAllowList } from '@utils/domain-allow-list.util';
import { logger } from '@utils/logger.util';

import { EXCEPTION_DOMAINS, SHORTS } from './constants/swindlers-urls.constant';
import type { DynamicStorageService } from './dynamic-storage.service';
import { urlService } from './url.service';

const harmfulUrlStart = ['https://bitly.com/a/blocked'];

export class SwindlersUrlsService {
  swindlersRegex: RegExp;

  swindlersFuzzySet!: FuzzySet;

  domainAllowList: DomainAllowList;

  constructor(
    private dynamicStorageService: DynamicStorageService,
    private rate = 0.9,
  ) {
    this.swindlersRegex = this.buildSiteRegex(this.dynamicStorageService.swindlerRegexSites);
    logger.info({ swindlersRegex: this.swindlersRegex }, 'swindlersRegex updated');

    this.initFuzzySet();
    this.domainAllowList = new DomainAllowList(this.dynamicStorageService.notSwindlers);

    this.dynamicStorageService.fetchEmitter.on('fetch', () => {
      this.swindlersRegex = this.buildSiteRegex(this.dynamicStorageService.swindlerRegexSites);
      this.domainAllowList.updateDomains(this.dynamicStorageService.notSwindlers);
      logger.info({ swindlersRegex: this.swindlersRegex }, 'swindlersRegex updated');
      this.initFuzzySet();
    });
  }

  buildSiteRegex(sites: string[]): RegExp {
    // eslint-disable-next-line security/detect-unsafe-regex, sonarjs/duplicates-in-character-class
    const regex = /(?:https?:\/\/)?([[sites]])(?!ua).+/;

    // eslint-disable-next-line security/detect-non-literal-regexp
    return new RegExp(regex.source.replace('[[sites]]', sites.join('|')));
  }

  /**
   * @description
   * Create and saves FuzzySet based on latest data from dynamic storage
   */
  initFuzzySet() {
    this.swindlersFuzzySet = FuzzySet(this.dynamicStorageService.swindlerDomains);
  }

  /**
   * Scans the message for URLs and checks each against swindler detection rules.
   * @param message - raw message from user to parse
   */
  async processMessage(message: string): Promise<SwindlersBaseResult | SwindlersUrlsResult | null> {
    const urls = urlService.parseUrls(message);

    if (urls.length > 0) {
      let lastResult: SwindlersBaseResult | SwindlersUrlsResult | null = null;
      const getUrls = urls.map((url) => this.isSpamUrl(url));
      const allUrls = await Promise.all(getUrls);

      const hasSwindlerUrl = allUrls.some((value) => {
        lastResult = value;

        return lastResult?.isSpam;
      });

      if (hasSwindlerUrl) {
        return lastResult;
      }
    }

    return null;
  }

  /**
   * Resolves a URL (following redirects) and checks it against the swindler database.
   * @param url
   * @param [customRate]
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
     */
    const redirectUrl = SHORTS.includes(urlService.getUrlDomain(url).slice(0, -1))
      ? await axios
          .get(url, { maxRedirects: 0 })
          .then(() => url)
          .catch(
            /**
             * Handles redirect/connection errors when resolving URL redirects.
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
                  logger.error(error);
                }

                return (error.response?.headers['location'] as string) || error.response?.config.url || url;
              } catch (nestedError: unknown) {
                logger.error(nestedError);

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

    if (EXCEPTION_DOMAINS.some((exceptionDomain) => domain.startsWith(exceptionDomain))) {
      return {
        rate: 0,
        isSpam: false,
      } as SwindlersBaseResult;
    }

    const isRegexpMatch = this.swindlersRegex.test(domain);

    if (isRegexpMatch) {
      const result = { isSpam: isRegexpMatch, rate: 200 } as SwindlersUrlsResult;

      if (environmentConfig.ENV !== 'production') {
        result.currentName = this.swindlersRegex.exec(domain)?.[0] || '$error';
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
