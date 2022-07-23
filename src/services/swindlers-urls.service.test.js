const axios = require('axios');
const { SwindlersUrlsService } = require('./swindlers-urls.service');
const { mockDynamicStorageService, mockNewUrl } = require('./_mocks/index.mocks');

jest.mock('axios');

/**
 * @type {SwindlersUrlsService}
 * */
let swindlersUrlsService;
describe('SwindlersUrlsService', () => {
  beforeAll(() => {
    swindlersUrlsService = new SwindlersUrlsService(mockDynamicStorageService, 0.6);
  });

  describe('buildSiteRegex', () => {
    it('should build site regex with passed sites', () => {
      const sites = ['test.com', 'example.com'];
      const result = swindlersUrlsService.buildSiteRegex(sites);

      expect(result.source).toEqual('(?:https?:\\/\\/)?(test.com|example.com)(?!ua).+');
    });
  });

  describe('parseUrls', () => {
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

    it('should not match excluded url', () => {
      const text = `https://${swindlersUrlsService.exceptionDomains.join(' https://')}`;
      const result = swindlersUrlsService.parseUrls(text);

      console.info(text);

      expect(result).toEqual([]);
    });
  });

  describe('getUrlDomain', () => {
    it('should parse domain', () => {
      const text = 'https://www.orpay.me/test/1234567890';
      const result = swindlersUrlsService.getUrlDomain(text);

      expect(result).toEqual('www.orpay.me/');
    });
  });

  describe('isSpamUrl', () => {
    it('should match swindlers url', async () => {
      const text = 'https://www.orpay.me';
      axios.get.mockImplementationOnce(() => Promise.resolve({ request: { res: { responseUrl: text } } }));
      const result = await swindlersUrlsService.isSpamUrl(text);

      expect(result.isSpam).toEqual(true);
    });

    it('should not match privat url', async () => {
      const text = 'https://next.privat24.ua/';
      axios.get.mockImplementationOnce(() => Promise.resolve({ request: { res: { responseUrl: text } } }));
      const result = await swindlersUrlsService.isSpamUrl(text);

      expect(result.isSpam).toEqual(false);
    });

    it('should match similar url', async () => {
      axios.get.mockImplementationOnce(() => Promise.resolve({ request: { res: { responseUrl: mockNewUrl } } }));

      const result = await swindlersUrlsService.isSpamUrl(mockNewUrl);

      expect(result.isSpam).toEqual(true);
      expect(result.rate).toBeGreaterThan(0.6);
    });

    it('should not match telegram url', async () => {
      axios.get.mockImplementationOnce(() => Promise.resolve({ request: { res: { responseUrl: 'https://t.me/+5v9SixsjZ9ZmMjBs' } } }));
      const result = await swindlersUrlsService.isSpamUrl('https://t.me/+5v9SixsjZ9ZmMjBs');

      expect(result.isSpam).toEqual(false);
    });

    it('should not ban messages from subfolder', async () => {
      axios.get.mockImplementationOnce(() =>
        Promise.resolve({
          request: {
            res: {
              responseUrl: 'https://electrek.co/2021/05/24/tesla-found-guilty-throttling-charging-speed-asked-pay-16000-thousands-owners/',
            },
          },
        }),
      );

      const result = await swindlersUrlsService.isSpamUrl(
        'https://electrek.co/2021/05/24/tesla-found-guilty-throttling-charging-speed-asked-pay-16000-thousands-owners/',
      );

      expect(result.isSpam).toEqual(false);
    });
  });

  describe('processMessage', () => {
    it('should process messages', async () => {
      const text = `https://da-pay.me/ тест`;
      axios.get.mockImplementationOnce(() => Promise.resolve({ request: { res: { responseUrl: 'https://da-pay.me/' } } }));
      const result = await swindlersUrlsService.processMessage(text);

      const parsedUrl = swindlersUrlsService.parseUrls(text)[0];
      axios.get.mockImplementationOnce(() => Promise.resolve({ request: { res: { responseUrl: parsedUrl } } }));
      const isUrlSpam = await swindlersUrlsService.isSpamUrl(parsedUrl);

      expect(parsedUrl).toEqual('https://da-pay.me/');
      expect(isUrlSpam.isSpam).toEqual(true);
      expect(result.isSpam).toEqual(true);
      expect(result.rate).toEqual(200);
    });

    it('should not process telegram message', async () => {
      const text = `Плохие новости 18+👇👇👇

    https://t.me/+5v9SixsjZ9ZmMjBs

    https://t.me/+5v9SixsjZ9ZmMjBs

    https://t.me/+5v9SixsjZ9ZmMjBs`;
      axios.get.mockImplementation(() => Promise.resolve({ request: { res: { responseUrl: 'https://t.me/+5v9SixsjZ9ZmMjBs' } } }));
      const result = await swindlersUrlsService.processMessage(text);

      const parsedUrl = swindlersUrlsService.parseUrls(text)[0];
      axios.get.mockImplementationOnce(() => Promise.resolve({ request: { res: { responseUrl: parsedUrl } } }));
      const isUrlSpam = await swindlersUrlsService.isSpamUrl(parsedUrl);

      expect(parsedUrl).toEqual('https://t.me/+5v9SixsjZ9ZmMjBs');
      expect(isUrlSpam.isSpam).toEqual(false);
      expect(result).toEqual(null);
    });
  });
});
