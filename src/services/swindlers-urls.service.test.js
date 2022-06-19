const { SwindlersUrlsService } = require('./swindlers-urls.service');

/**
 * @type {SwindlersUrlsService}
 * */
let swindlersUrlsService;
describe('SwindlersUrlsService', () => {
  beforeAll(() => {
    swindlersUrlsService = new SwindlersUrlsService();
  });

  it('should parse urls', () => {
    const text = `test https://url.com/ test url.com`;
    const result = swindlersUrlsService.parseUrls(text);

    console.info(text);

    expect(result).toEqual(['https://url.com/', 'url.com']);
  });

  it('should not parse invalid urls', () => {
    const text = `100.000.000 | 1.Перейдіть | 30.06.2022.`;
    const result = swindlersUrlsService.parseUrls(text);

    expect(result).toEqual([]);
  });

  it('should not match no url', () => {
    const text = 'бездротові Bluetooth Air3Ye XM-050';
    const result = swindlersUrlsService.parseUrls(text);

    expect(result).toEqual([]);
  });

  it('should match swindlers url', () => {
    const text = 'https://www.orpay.me';
    const result = swindlersUrlsService.isSpamUrl(text);

    expect(result).toEqual(true);
  });

  it('should parse domain', () => {
    const text = 'https://www.orpay.me/test/1234567890';
    const result = swindlersUrlsService.getUrlDomain(text);

    expect(result).toEqual('www.orpay.me');
  });

  it('should not match privat url', () => {
    const text = 'https://next.privat24.ua/';
    const result = swindlersUrlsService.isSpamUrl(text);

    expect(result).toEqual(false);
  });

  it('should not match excluded url', () => {
    const text = `https://${swindlersUrlsService.exceptionDomains.join(' https://')}`;
    const result = swindlersUrlsService.parseUrls(text);

    console.info(text);

    expect(result).toEqual([]);
  });
});
