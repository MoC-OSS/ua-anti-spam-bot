import { DomainAllowList } from '@utils/domain-allow-list.util';

describe('DomainAllowList', () => {
  it('should allow any url if the domain is present', () => {
    const domainAllowList = new DomainAllowList(['example.com']);
    const isAllowed = domainAllowList.isAllowed('https://example.com/test-url');

    expect(isAllowed).toBeTruthy();
  });

  it('should ignore protocol of any url if the domain is present', () => {
    const domainAllowList = new DomainAllowList(['http://example.com']);
    const isAllowed = domainAllowList.isAllowed('https://example.com/test-url');

    expect(isAllowed).toBeTruthy();
  });

  it('should work without protocol', () => {
    const domainAllowList = new DomainAllowList(['https://example.com']);
    const isAllowed = domainAllowList.isAllowed('example.com/test-url');

    expect(isAllowed).toBeTruthy();
  });

  it('should work if / at the end of domain url', () => {
    const domainAllowList = new DomainAllowList(['https://example.com/']);
    const isAllowed = domainAllowList.isAllowed('example.com/test-url');

    expect(isAllowed).toBeTruthy();
  });

  it('should work if / at the end of check url', () => {
    const domainAllowList = new DomainAllowList(['https://example.com']);
    const isAllowed = domainAllowList.isAllowed('example.com/test-url/');

    expect(isAllowed).toBeTruthy();
  });

  it('should ignore domain if domain url has routes', () => {
    const domainAllowList = new DomainAllowList(['https://example.com/exclude']);
    const isAllowed = domainAllowList.isAllowed('example.com');

    expect(isAllowed).toBeFalsy();
  });

  it('should delete exactly link if it was provided in domains', () => {
    const domainAllowList = new DomainAllowList(['https://example.com/exclude']);
    const isAllowed = domainAllowList.isAllowed('example.com/exclude/');

    expect(isAllowed).toBeTruthy();
  });

  it('should match link by domain pattern', () => {
    const domainAllowList = new DomainAllowList(['*example.com*']);
    const isAllowed = domainAllowList.isAllowed('any.example.com/path');

    expect(isAllowed).toBeTruthy();
  });
});
