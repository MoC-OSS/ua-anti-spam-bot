import axios from 'axios';

import { getMockDynamicStorageService, mockDynamicStorageService, mockNewUrl } from '@services/_mocks/index.mocks';
import { SwindlersUrlsService } from '@services/swindlers-urls.service';
import { urlService } from '@services/url.service';

import { environmentConfig } from '@shared/config';

import { logger } from '@utils/logger.util';

vi.mock('axios');

const axiosMock = { get: vi.mocked(axios.get) };

/**
 */
let swindlersUrlsService: SwindlersUrlsService;

describe('SwindlersUrlsService', () => {
  beforeAll(() => {
    swindlersUrlsService = new SwindlersUrlsService(mockDynamicStorageService, 0.6);
  });

  beforeEach(() => {
    // Flush any unconsumed mockImplementationOnce queue to prevent cross-test contamination.
    // Non-SHORTS URLs skip axios.get, leaving queued mocks that would otherwise bleed into
    // subsequent SHORTS-domain tests and exercise the wrong code branch.
    axiosMock.get.mockReset();
  });

  describe('buildSiteRegex', () => {
    it('should build site regex with passed sites', () => {
      const sites = ['test.com', 'example.com'];
      const result = swindlersUrlsService.buildSiteRegex(sites);

      expect(result.source).toEqual(String.raw`(?:https?:\/\/)?(test.com|example.com)(?!ua).+`);
    });
  });

  describe('initFuzzySet', () => {
    it('should initialize FuzzySet from dynamic storage swindler domains', () => {
      swindlersUrlsService.initFuzzySet();

      expect(swindlersUrlsService.swindlersFuzzySet).toBeDefined();
    });
  });

  describe('isSpamUrl', () => {
    it('should return not spam for empty url', async () => {
      const result = await swindlersUrlsService.isSpamUrl('');

      expect(result.isSpam).toEqual(false);
      expect(result.rate).toEqual(0);
    });

    it('should match swindlers url', async () => {
      const text = 'https://www.orpay.me';

      axiosMock.get.mockImplementationOnce(() => Promise.resolve({ request: { res: { responseUrl: text } } }));
      const result = await swindlersUrlsService.isSpamUrl(text);

      expect(result.isSpam).toEqual(true);
    });

    it('should not set currentName on regex match when ENV is production', async () => {
      const originalEnvironment = environmentConfig.ENV;

      try {
        (environmentConfig as unknown as Record<string, unknown>).ENV = 'production';
        const result = await swindlersUrlsService.isSpamUrl('https://www.orpay.me');

        expect(result.isSpam).toEqual(true);
        expect((result as unknown as Record<string, unknown>).currentName).toBeUndefined();
      } finally {
        (environmentConfig as unknown as Record<string, unknown>).ENV = originalEnvironment;
      }
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

    it('should return spam when SHORTS redirect resolves to a blocked bitly url', async () => {
      axiosMock.get.mockImplementationOnce(() =>
        Promise.reject(
          Object.assign(new Error('redirect'), { response: { headers: { location: 'https://bitly.com/a/blocked/some-path' } } }),
        ),
      );

      const result = await swindlersUrlsService.isSpamUrl('https://bit.ly/some-blocked-link');

      expect(result.isSpam).toEqual(true);
      expect(result.rate).toEqual(300);
    });

    it('should return not spam for url in domainAllowList', async () => {
      const mockStorage = getMockDynamicStorageService();

      mockStorage.notSwindlers = ['safe-domain.com'];
      const service = new SwindlersUrlsService(mockStorage, 0.6);

      const result = await service.isSpamUrl('https://safe-domain.com/page');

      expect(result.isSpam).toEqual(false);
      expect(result.rate).toEqual(0);
    });

    it('should use customRate as the threshold instead of the default rate', async () => {
      // customRate=0.01 means even a tiny fuzzy match triggers isSpam; exercises the customRate branch
      const result = await swindlersUrlsService.isSpamUrl(mockNewUrl, 0.01);

      expect(result.isSpam).toEqual(true);
    });

    describe('SHORTS redirect error handling', () => {
      const shortUrl = 'https://bit.ly/test-error-case';

      it('should return original url on ENOTFOUND + getaddrinfo', async () => {
        axiosMock.get.mockImplementationOnce(() =>
          Promise.reject(Object.assign(new Error('ENOTFOUND'), { code: 'ENOTFOUND', syscall: 'getaddrinfo' })),
        );

        const result = await swindlersUrlsService.isSpamUrl(shortUrl);

        expect(result.isSpam).toEqual(false);
      });

      it('should return original url on ECONNREFUSED + connect', async () => {
        axiosMock.get.mockImplementationOnce(() =>
          Promise.reject(Object.assign(new Error('ECONNREFUSED'), { code: 'ECONNREFUSED', syscall: 'connect' })),
        );

        const result = await swindlersUrlsService.isSpamUrl(shortUrl);

        expect(result.isSpam).toEqual(false);
      });

      it('should return original url on ETIMEDOUT + connect', async () => {
        axiosMock.get.mockImplementationOnce(() =>
          Promise.reject(Object.assign(new Error('ETIMEDOUT'), { code: 'ETIMEDOUT', syscall: 'connect' })),
        );

        const result = await swindlersUrlsService.isSpamUrl(shortUrl);

        expect(result.isSpam).toEqual(false);
      });

      it('should return original url on ERR_TLS_CERT_ALTNAME_INVALID', async () => {
        axiosMock.get.mockImplementationOnce(() =>
          Promise.reject(Object.assign(new Error('ERR_TLS'), { code: 'ERR_TLS_CERT_ALTNAME_INVALID' })),
        );

        const result = await swindlersUrlsService.isSpamUrl(shortUrl);

        expect(result.isSpam).toEqual(false);
      });

      it('should return original url on ECONNRESET', async () => {
        axiosMock.get.mockImplementationOnce(() => Promise.reject(Object.assign(new Error('ECONNRESET'), { code: 'ECONNRESET' })));

        const result = await swindlersUrlsService.isSpamUrl(shortUrl);

        expect(result.isSpam).toEqual(false);
      });

      it('should return original url on DEPTH_ZERO_SELF_SIGNED_CERT', async () => {
        axiosMock.get.mockImplementationOnce(() =>
          Promise.reject(Object.assign(new Error('DEPTH_ZERO'), { code: 'DEPTH_ZERO_SELF_SIGNED_CERT' })),
        );

        const result = await swindlersUrlsService.isSpamUrl(shortUrl);

        expect(result.isSpam).toEqual(false);
      });

      it('should log error and return original url when error has no response', async () => {
        const errorSpy = vi.spyOn(logger, 'error');

        axiosMock.get.mockImplementationOnce(() =>
          Promise.reject(Object.assign(new Error('UnknownError'), { code: 'SOME_UNHANDLED_CODE' })),
        );

        const result = await swindlersUrlsService.isSpamUrl(shortUrl);

        expect(errorSpy).toHaveBeenCalled();
        expect(result).toBeDefined();
        errorSpy.mockRestore();
      });

      it('should follow location header from error response and detect swindler', async () => {
        const redirectTarget = 'https://orpay.me/checkout';

        axiosMock.get.mockImplementationOnce(() =>
          Promise.reject(Object.assign(new Error('redirect'), { response: { headers: { location: redirectTarget }, config: {} } })),
        );

        const result = await swindlersUrlsService.isSpamUrl(shortUrl);

        expect(result.isSpam).toEqual(true);
      });

      it('should fall back to config.url when error response has no location header', async () => {
        const configUrl = 'https://electrek.co/safe-article';

        axiosMock.get.mockImplementationOnce(() =>
          Promise.reject(Object.assign(new Error('redirect'), { response: { headers: {}, config: { url: configUrl } } })),
        );

        const result = await swindlersUrlsService.isSpamUrl(shortUrl);

        expect(result.isSpam).toEqual(false);
      });

      it('should log nested error and return original url when response access throws', async () => {
        const errorSpy = vi.spyOn(logger, 'error');

        const error = {
          get response(): never {
            throw new Error('simulated nested access error');
          },
        };

        axiosMock.get.mockImplementationOnce(() => Promise.reject(error));

        const result = await swindlersUrlsService.isSpamUrl(shortUrl);

        expect(errorSpy).toHaveBeenCalled();
        expect(result).toBeDefined();
        errorSpy.mockRestore();
      });
    });
  });

  describe('processMessage', () => {
    it('should process messages', async () => {
      const text = 'https://da-pay.me/ тест';

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

    it('should return null when message has no urls', async () => {
      const result = await swindlersUrlsService.processMessage('plain text without any links');

      expect(result).toBeNull();
    });

    it('should return null when urls are found but none are spam', async () => {
      const result = await swindlersUrlsService.processMessage('visit https://electrek.co/article for details');

      expect(result).toBeNull();
    });
  });

  describe('fetchEmitter', () => {
    it('should reinitialize regex and fuzzyset when fetch event is emitted', () => {
      const initFuzzySetSpy = vi.spyOn(swindlersUrlsService, 'initFuzzySet');
      const buildSiteRegexSpy = vi.spyOn(swindlersUrlsService, 'buildSiteRegex');

      mockDynamicStorageService.fetchEmitter.emit('fetch');

      expect(initFuzzySetSpy).toHaveBeenCalled();
      expect(buildSiteRegexSpy).toHaveBeenCalled();

      initFuzzySetSpy.mockRestore();
      buildSiteRegexSpy.mockRestore();
    });
  });
});
