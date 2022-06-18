const { swindlersRegex } = require('../creator');

class SwindlersUrlsService {
  constructor() {
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
        return !!new URL(validUrl) && this.validUrlRegexp.test(validUrl);
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
   * @returns {boolean}
   */
  isSpamUrl(url) {
    return swindlersRegex.test(url);
  }
}

module.exports = {
  SwindlersUrlsService,
};
