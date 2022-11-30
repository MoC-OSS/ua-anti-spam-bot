import { EXCEPTION_DOMAINS } from './constants';
import { urlService } from './url.service';

describe('UrlService', () => {
  describe('parseUrls', () => {
    it('should parse urls', () => {
      const text = `test https://url.com/ test url.com`;
      const result = urlService.parseUrls(text);

      console.info(text);

      expect(result).toEqual(['https://url.com/', 'url.com']);
    });

    it('should not parse invalid urls', () => {
      const text = `100.000.000 | 1.Перейдіть | 30.06.2022.`;
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

      console.info(text);

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
  });

  describe('processMessage', () => {
    it('should process messages', () => {
      const text = `https://da-pay.me/ тест`;
      const parsedUrl = urlService.parseUrls(text)[0];

      expect(parsedUrl).toEqual('https://da-pay.me/');
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
