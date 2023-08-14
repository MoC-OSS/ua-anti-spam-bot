import { DomainAllowList } from '../domain-allow-list';

describe('DomainAllowList', () => {
  it('should allow any url if the domain is present', () => {
    const domainAllowList = new DomainAllowList(['example.com']);
    const result = domainAllowList.isAllowed('https://example.com/test-url');

    expect(result).toBeTruthy();
  });

  it('should ignore protocol of any url if the domain is present', () => {
    const domainAllowList = new DomainAllowList(['http://example.com']);
    const result = domainAllowList.isAllowed('https://example.com/test-url');

    expect(result).toBeTruthy();
  });

  it('should work without protocol', () => {
    const domainAllowList = new DomainAllowList(['https://example.com']);
    const result = domainAllowList.isAllowed('example.com/test-url');

    expect(result).toBeTruthy();
  });

  it('should work if / at the end of domain url', () => {
    const domainAllowList = new DomainAllowList(['https://example.com/']);
    const result = domainAllowList.isAllowed('example.com/test-url');

    expect(result).toBeTruthy();
  });

  it('should work if / at the end of check url', () => {
    const domainAllowList = new DomainAllowList(['https://example.com']);
    const result = domainAllowList.isAllowed('example.com/test-url/');

    expect(result).toBeTruthy();
  });

  it('should ignore domain if domain url has routes', () => {
    const domainAllowList = new DomainAllowList(['https://example.com/exclude']);
    const result = domainAllowList.isAllowed('example.com');

    expect(result).toBeFalsy();
  });

  it('should delete exactly link if it was provided in domains', () => {
    const domainAllowList = new DomainAllowList(['https://example.com/exclude']);
    const result = domainAllowList.isAllowed('example.com/exclude/');

    expect(result).toBeTruthy();
  });
});
