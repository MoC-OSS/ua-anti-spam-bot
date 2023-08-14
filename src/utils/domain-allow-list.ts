import { urlService } from '../services';

export class DomainAllowList {
  private allowDomains: Set<string> = new Set();

  private allowDomainPatterns: RegExp[] = [];

  constructor(allowDomains: string[]) {
    const baseUrls = allowDomains.filter((domain) => !domain.startsWith('@')).map((url) => this.processLink(url));

    this.allowDomains = new Set(baseUrls.sort((a, b) => a.localeCompare(b)));
    this.allowDomainPatterns = baseUrls.filter((url) => url.includes('*')).map((patternUrl) => this.createRegexFromPattern(patternUrl));
  }

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

  createRegexFromPattern(pattern: string) {
    // Escape special characters in the pattern and replace '*' with '.*'
    const escapedPattern = pattern
      .replace(/[$()*+.?[\\\]^{|}]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\\.\*/g, '.*');

    // Create a regular expression with the pattern
    return new RegExp(`^${escapedPattern}$`, 'i');
  }
}
