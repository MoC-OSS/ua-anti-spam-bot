import { EXCEPTION_DOMAINS } from '@services/constants/swindlers-urls.constant';
import { urlService } from '@services/url.service';

import { logger } from '@utils/logger.util';

describe('UrlService', () => {
  describe('parseUrls', () => {
    it('should parse urls', () => {
      const text = 'test https://url.com/ test url.com';
      const result = urlService.parseUrls(text);

      logger.info(text);

      expect(result).toEqual(['https://url.com']);
    });

    it('should parse urls without special symbols at the end', () => {
      const text = 'test https://url.com/, test url.com. http://24.site/?order=946, http://24privat.site/?order=94696970126<';
      const result = urlService.parseUrls(text);

      logger.info(text);

      // eslint-disable-next-line sonarjs/no-clear-text-protocols
      expect(result).toEqual(['https://url.com', 'http://24.site/?order=946', 'http://24privat.site/?order=94696970126']);
    });

    it('should not parse invalid urls', () => {
      const text = '100.000.000 | 1.Перейдіть | 30.06.2022.';
      const result = urlService.parseUrls(text);

      expect(result).toEqual([]);
    });

    it('should not match no url', () => {
      const text = 'бездротові Bluetooth Air3Ye XM-050';
      const result = urlService.parseUrls(text);

      expect(result).toEqual([]);
    });

    it('should not match excluded url', () => {
      const text = `https://${EXCEPTION_DOMAINS.join(' https://')}`;
      const result = urlService.parseUrls(text);

      logger.info(text);

      expect(result).toEqual([]);
    });

    // TODO fix this case
    it('should not parse extra characters', () => {
      const text = 'https://test.site/get/0426053194✅🇺🇦/';
      const result = urlService.parseUrls(text);

      expect(result).toStrictEqual([]);
    });
  });

  describe('getUrlDomain', () => {
    it('should parse domain', () => {
      const text = 'https://www.orpay.me/test/1234567890';
      const result = urlService.getUrlDomain(text);

      expect(result).toEqual('www.orpay.me/');
    });

    it('should parse domain from string with /', () => {
      const text = 'https://www.orpay.me/';
      const result = urlService.getUrlDomain(text);

      expect(result).toEqual('www.orpay.me/');
    });

    it('should parse domain from string without /', () => {
      const text = 'https://www.orpay.me';
      const result = urlService.getUrlDomain(text);

      expect(result).toEqual('www.orpay.me/');
    });
  });

  describe('processMessage', () => {
    it('should process messages', () => {
      const text = 'https://da-pay.me/ тест';
      const parsedUrl = urlService.parseUrls(text)[0];

      expect(parsedUrl).toEqual('https://da-pay.me');
    });

    it('should not process telegram message', () => {
      const text = `Плохие новости 18+👇👇👇

    https://t.me/+5v9SixsjZ9ZmMjBs

    https://t.me/+5v9SixsjZ9ZmMjBs

    https://t.me/+5v9SixsjZ9ZmMjBs`;

      const parsedUrl = urlService.parseUrls(text)[0];

      expect(parsedUrl).toEqual(undefined);
    });
  });
});
