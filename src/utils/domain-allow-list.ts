import { urlService } from '../services';

/**
 * Domain allow list for filtering URLs.
 */
export class DomainAllowList {
  private allowDomains: Set<string> = new Set();

  private allowDomainPatterns: RegExp[] = [];

  constructor(allowDomains: string[]) {
    this.updateDomains(allowDomains);
  }

  updateDomains(allowDomains: string[]) {
    const baseUrls = allowDomains.filter((domain) => !domain.startsWith('@')).map((url) => this.processLink(url));

    this.allowDomains = new Set(baseUrls.sort((a, b) => a.localeCompare(b)));
    this.allowDomainPatterns = baseUrls.filter((url) => url.includes('*')).map((patternUrl) => this.createRegexFromPattern(patternUrl));
  }

  /**
   * Processes a URL by removing common prefixes and suffixes.
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
   */
  createRegexFromPattern(pattern: string) {
    // Escape special characters in the pattern and replace '*' with '.*'
    const escapedPattern = pattern
      .replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&')
      .replaceAll('*', '.*')
      .replaceAll(/\\.\*/g, '.*');

    // Create a regular expression with the pattern
    return new RegExp(`^${escapedPattern}$`, 'i');
  }
}
