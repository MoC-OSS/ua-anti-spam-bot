const FuzzySet = require('fuzzyset');

class SwindlersUrlsService {
  /**
   * @param {DynamicStorageService} dynamicStorageService
   * @param {number} [rate]
   * */
  constructor(dynamicStorageService, rate = 0.9) {
    this.dynamicStorageService = dynamicStorageService;
    this.rate = rate;

    this.urlRegexp =
      /(https?:\/\/(?:www\.|(?!www))?[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|(https?:\/\/(?:www\.|(?!www)))?[a-zA-Z0-9-]+\.[^\s]{2,}|www\.?[a-zA-Z0-9]+\.[^\s]{2,})/g;
    this.validUrlRegexp = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
      'i',
    );
    this.exceptionDomains = [
      'gmail.com',
      'google.com',
      'irs.gov',
      'liqpay.ua',
      'monobank.ua',
      'next.privat24.ua',
      'pay.vn.ua',
      'payoneer.com',
      'paypal.com',
      'privat24.ua',
      'www.google.com',
    ];

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
  processMessage(message) {
    const urls = this.parseUrls(message);
    if (urls) {
      let lastResult = null;
      const foundSwindlerUrl = urls.some((value) => {
        lastResult = this.isSpamUrl(value);
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
   * @returns {string[]}
   */
  parseUrls(message) {
    return (message.match(this.urlRegexp) || []).filter((url) => {
      const validUrl = url.slice(0, 4) === 'http' ? url : `https://${url}`;
      try {
        const urlInstance = new URL(validUrl);
        return urlInstance && !this.exceptionDomains.includes(urlInstance.host) && this.validUrlRegexp.test(validUrl);
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
    return new URL(validUrl).host;
  }

  /**
   * @param {string} url
   * @param {number} [customRate]
   */
  isSpamUrl(url, customRate) {
    const isRegexpMatch = this.swindlersRegex.test(url);
    if (isRegexpMatch) {
      return { isSpam: isRegexpMatch, rate: 200 };
    }

    const domain = this.getUrlDomain(url);
    const [[rate, nearestName]] = this.swindlersFuzzySet.get(domain) || [[0]];

    return {
      isSpam: rate > (customRate || this.rate),
      rate,
      nearestName,
      currentName: domain,
    };
  }
}

module.exports = {
  SwindlersUrlsService,
};
