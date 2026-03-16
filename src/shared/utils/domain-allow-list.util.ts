import { urlService } from '@services/url.service';

/**
 * Domain allow list for filtering URLs.
 */
export class DomainAllowList {
  private allowDomains: Set<string> = new Set();

  private allowDomainPatterns: RegExp[] = [];

  constructor(allowDomains: string[]) {
    this.updateDomains(allowDomains);
  }

  /**
   * Replaces the internal allow-list with the provided domain entries.
   * @param allowDomains - Array of domain strings or pattern strings to allow
   */
  updateDomains(allowDomains: string[]) {
    const baseUrls = allowDomains.filter((domain) => !domain.startsWith('@')).map((url) => this.processLink(url));

    this.allowDomains = new Set(baseUrls.toSorted((left, right) => left.localeCompare(right)));
    this.allowDomainPatterns = baseUrls.filter((url) => url.includes('*')).map((patternUrl) => this.createRegexFromPattern(patternUrl));
  }

  /**
   * Processes a URL by removing common prefixes and suffixes.
   * @param url - The URL string to normalize
   * @returns The normalized URL with protocol, www prefix, and trailing slash removed
   */
  processLink(url: string): string {
    let newUrl = url;

    if (newUrl.startsWith('http://')) {
      newUrl = newUrl.replace('http://', '');
    }

    if (newUrl.startsWith('https://')) {
      newUrl = newUrl.replace('https://', '');
    }

    if (newUrl.startsWith('www.')) {
      newUrl = newUrl.replace('www.', '');
    }

    if (newUrl.endsWith('/')) {
      newUrl = newUrl.slice(0, -1);
    }

    return newUrl;
  }

  /**
   * Checks whether a URL's domain is in the allow-list.
   * @param url - The URL string to check against the allow-list
   * @returns True if the URL domain is allowed, false otherwise
   */
  isAllowed(url: string): boolean {
    if (this.allowDomains.has(url)) {
      return true;
    }

    const clearUrl = this.processLink(url);

    if (this.allowDomains.has(clearUrl)) {
      return true;
    }

    if (this.allowDomainPatterns.some((pattern) => pattern.test(clearUrl))) {
      return true;
    }

    const domain = urlService.getUrlDomain(clearUrl).slice(0, -1);

    return this.allowDomains.has(domain);
  }

  /**
   * Creates a regular expression from a domain pattern.
   * @param pattern - The domain pattern string, may include wildcard `*` characters
   * @returns A RegExp that matches URLs conforming to the given pattern
   */
  createRegexFromPattern(pattern: string) {
    // Escape special characters in the pattern and replace '*' with '.*'
    const escapedPattern = pattern
      .replaceAll(/[$()*+.?[\\\]^{|}]/g, String.raw`\$&`)
      .replaceAll('*', '.*')
      .replaceAll(/\\.\*/g, '.*');

    // Create a regular expression with the pattern
    // eslint-disable-next-line security/detect-non-literal-regexp
    return new RegExp(`^${escapedPattern}$`, 'i');
  }
}
