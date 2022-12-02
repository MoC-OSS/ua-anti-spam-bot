import axios from 'axios';

import { mockDynamicStorageService, mockNewUrl } from './_mocks/index.mocks';
import { SwindlersUrlsService } from './swindlers-urls.service';
import { urlService } from './url.service';

jest.mock('axios');

const axiosMock = axios as jest.Mocked<typeof axios>;

/**
 * @type {SwindlersUrlsService}
 * */
let swindlersUrlsService: SwindlersUrlsService;
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

  describe('isSpamUrl', () => {
    it('should match swindlers url', async () => {
      const text = 'https://www.orpay.me';
      axiosMock.get.mockImplementationOnce(() => Promise.resolve({ request: { res: { responseUrl: text } } }));
      const result = await swindlersUrlsService.isSpamUrl(text);

      expect(result.isSpam).toEqual(true);
    });

    it('should not match privat url', async () => {
      const text = 'https://next.privat24.ua/';
      axiosMock.get.mockImplementationOnce(() => Promise.resolve({ request: { res: { responseUrl: text } } }));
      const result = await swindlersUrlsService.isSpamUrl(text);

      expect(result.isSpam).toEqual(false);
    });

    it('should match similar url', async () => {
      axiosMock.get.mockImplementationOnce(() => Promise.resolve({ request: { res: { responseUrl: mockNewUrl } } }));

      const result = await swindlersUrlsService.isSpamUrl(mockNewUrl);

      expect(result.isSpam).toEqual(true);
      expect(result.rate).toBeGreaterThan(0.6);
    });

    it('should not match telegram url', async () => {
      axiosMock.get.mockImplementationOnce(() => Promise.resolve({ request: { res: { responseUrl: 'https://t.me/+5v9SixsjZ9ZmMjBs' } } }));
      const result = await swindlersUrlsService.isSpamUrl('https://t.me/+5v9SixsjZ9ZmMjBs');

      expect(result.isSpam).toEqual(false);
    });

    it('should not ban messages from subfolder', async () => {
      axiosMock.get.mockImplementationOnce(() =>
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

    it('should resolve links from link shortener', async () => {
      axiosMock.get.mockImplementationOnce(() =>
        Promise.resolve({
          request: {
            res: {
              responseUrl: 'https://electrek.co/2021/05/24/tesla-found-guilty-throttling-charging-speed-asked-pay-16000-thousands-owners/',
            },
          },
        }),
      );

      const result = await swindlersUrlsService.isSpamUrl('https://bit.ly/test-swindler-mock');

      expect(axiosMock.get).toHaveBeenCalled();
      expect(result.isSpam).toEqual(false);
    });
  });

  describe('processMessage', () => {
    it('should process messages', async () => {
      const text = `https://da-pay.me/ тест`;
      axiosMock.get.mockImplementationOnce(() => Promise.resolve({ request: { res: { responseUrl: 'https://da-pay.me/' } } }));
      const result = await swindlersUrlsService.processMessage(text);

      const parsedUrl = urlService.parseUrls(text)[0];
      axiosMock.get.mockImplementationOnce(() => Promise.resolve({ request: { res: { responseUrl: parsedUrl } } }));
      const isUrlSpam = await swindlersUrlsService.isSpamUrl(parsedUrl);

      expect(parsedUrl).toEqual('https://da-pay.me');
      expect(isUrlSpam.isSpam).toEqual(true);
      expect(result?.isSpam).toEqual(true);
      expect(result?.rate).toEqual(200);
    });

    it('should not process telegram message', async () => {
      const text = `Плохие новости 18+👇👇👇

    https://t.me/+5v9SixsjZ9ZmMjBs

    https://t.me/+5v9SixsjZ9ZmMjBs

    https://t.me/+5v9SixsjZ9ZmMjBs`;
      axiosMock.get.mockImplementation(() => Promise.resolve({ request: { res: { responseUrl: 'https://t.me/+5v9SixsjZ9ZmMjBs' } } }));
      const result = await swindlersUrlsService.processMessage(text);

      const parsedUrl = urlService.parseUrls(text)[0];
      axiosMock.get.mockImplementationOnce(() => Promise.resolve({ request: { res: { responseUrl: parsedUrl } } }));
      const isUrlSpam = await swindlersUrlsService.isSpamUrl(parsedUrl);

      expect(parsedUrl).toEqual(undefined);
      expect(isUrlSpam.isSpam).toEqual(false);
      expect(result).toEqual(null);
    });
  });
});
