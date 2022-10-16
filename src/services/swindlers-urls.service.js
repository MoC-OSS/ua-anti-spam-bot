const FuzzySet = require('fuzzyset');
const axios = require('axios');
const { URL_REGEXP, VALID_URL_REGEXP, EXCEPTION_DOMAINS, SHORTS } = require('./constants/swindlers-urls.constant');

const harmfulUrlStart = ['https://bitly.com/a/blocked'];

class SwindlersUrlsService {
  /**
   * @param {DynamicStorageService} dynamicStorageService
   * @param {number} [rate]
   * */
  constructor(dynamicStorageService, rate = 0.9) {
    this.dynamicStorageService = dynamicStorageService;
    this.rate = rate;
    this.swindlersRegex = this.buildSiteRegex(this.dynamicStorageService.swindlerRegexSites);
    console.info('swindlersRegex', this.swindlersRegex);
    this.initFuzzySet();
    this.dynamicStorageService.fetchEmmiter.on('fetch', () => {
      this.swindlersRegex = this.buildSiteRegex(this.dynamicStorageService.swindlerRegexSites);
      console.info('swindlersRegex', this.swindlersRegex);
      this.initFuzzySet();
    });
  }

  buildSiteRegex(sites) {
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
  async processMessage(message) {
    const urls = this.parseUrls(message);
    if (urls) {
      let lastResult = null;
      const getUrls = urls.map((e) => this.isSpamUrl(e));
      const allUrls = await Promise.all(getUrls);
      const foundSwindlerUrl = allUrls.some((value) => {
        lastResult = value;
        return lastResult.isSpam;
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
   * @returns {string[] | false}
   */
  parseUrls(message) {
    return (message.match(URL_REGEXP) || []).filter((url) => {
      const validUrl = url.slice(0, 4) === 'http' ? url : `https://${url}`;
      try {
        const urlInstance = new URL(validUrl);
        return urlInstance && !EXCEPTION_DOMAINS.includes(urlInstance.host) && VALID_URL_REGEXP.test(validUrl);
      } catch (e) {
        return false;
      }
    });
  }

  /**
   * @param {string} url
   * @returns {string | null}
   */
  getUrlDomain(url) {
    const validUrl = url.slice(0, 4) === 'http' ? url : `https://${url}`;
    return `${new URL(validUrl).host}/`;
  }

  /**
   * @param {string} url
   * @param {number} [customRate]
   */
  async isSpamUrl(url, customRate) {
    if (!url) {
      return {
        rate: 0,
        isSpam: false,
      };
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
             * @param {AxiosError} err
             */
            (err) => {
              if (err.code === 'ENOTFOUND' && err.syscall === 'getaddrinfo') {
                return url;
              }

              if (err.code === 'ECONNREFUSED' && err.syscall === 'connect') {
                return url;
              }

              if (err.code === 'ETIMEDOUT' && err.syscall === 'connect') {
                return url;
              }

              if (err.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
                return url;
              }

              if (err.code === 'ECONNRESET') {
                return url;
              }

              try {
                if (!err.response) {
                  console.error(err);
                }

                return err.response.headers.location || err.response.config.url || url;
              } catch (e) {
                console.error(e);
                return url;
              }
            },
          )
      : url;

    if (harmfulUrlStart.some((start) => redirectUrl.startsWith(start))) {
      return { isSpam: true, rate: 300 };
    }

    const domain = this.getUrlDomain(redirectUrl);
    const isRegexpMatch = this.swindlersRegex.test(domain);
    if (isRegexpMatch) {
      return { isSpam: isRegexpMatch, rate: 200 };
    }

    const [[rate, nearestName]] = this.swindlersFuzzySet.get(domain) || [[0]];

    return {
      isSpam: rate > (customRate || this.rate),
      rate,
      nearestName,
      currentName: domain,
      redirectUrl,
    };
  }
}

module.exports = {
  SwindlersUrlsService,
};
