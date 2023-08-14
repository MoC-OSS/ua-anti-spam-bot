import { urlService } from '../services';

export class DomainAllowList {
  private readonly allowDomains: Set<string>;

  constructor(allowDomains: string[]) {
    const baseUrls = allowDomains.filter((domain) => !domain.startsWith('@')).map((url) => this.processLink(url));

    this.allowDomains = new Set(baseUrls.sort((a, b) => a.localeCompare(b)));
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

    const domain = urlService.getUrlDomain(clearUrl).slice(0, -1);

    return this.allowDomains.has(domain);
  }
}
