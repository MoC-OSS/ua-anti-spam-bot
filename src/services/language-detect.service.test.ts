import { languageDetectUaMocks } from './_mocks/language-detect.mocks';
import { languageDetectService } from './language-detect.service';

describe('LanguageDetectService', () => {
  describe('isRussian', () => {
    it('should return true if russian', () => {
      const text = 'съешь еще этих французских булок';
      const result = languageDetectService.isRussian(text);

      expect(result.result).toEqual(true);
    });

    it('should return true if russian edge case', () => {
      const text =
        '🗂 Номер телефона\n' +
        '\n' +
        'Вам необходимо подтвердить номер телефона для того, чтобы завершить идентификацию.\n' +
        'Для этого нажмите кнопку ниже.';
      const result = languageDetectService.isRussian(text);

      expect(result.result).toEqual(true);
    });

    it('should return false if ukrainian edge case', () => {
      const text = 'Нажерлись гречки і серуть';
      const result = languageDetectService.isRussian(text);

      expect(result.result).toEqual(false);
    });

    it('should return false if ukrainian', () => {
      const text = 'Інтернет були взірцем для наслідування для всіх, хто хоче говорити українською правильно';
      const result = languageDetectService.isRussian(text);

      expect(result.result).toEqual(false);
    });

    it('should except ukrainian for all messages', () => {
      const results = languageDetectUaMocks.map((text) => languageDetectService.detect(text));

      expect(results).toMatchSnapshot();
    });
  });

  describe('detect', () => {
    it('should detect russian', () => {
      const text = 'съешь еще этих французских булок';
      const result = languageDetectService.detect(text);

      expect(result).toMatchSnapshot();
    });

    it('should detect surzhik as ukrainian', () => {
      const text = "Добре утро. Як діла? оплатити білєтіки. пред''явити удостовірєніє";
      const result = languageDetectService.detect(text);

      expect(result).toMatchSnapshot();
    });

    it('should detect ukrainian', () => {
      const text = 'Інтернет були взірцем для наслідування для всіх, хто хоче говорити українською правильно';
      const result = languageDetectService.detect(text);

      expect(result).toMatchSnapshot();
    });

    it('should not detect russian when mixed', () => {
      const text =
        'съешь еще этих французских булок. Інтернет були взірцем для наслідування для всіх, хто хоче говорити українською правильно.';
      const result = languageDetectService.detect(text);

      expect(result).toMatchSnapshot();
    });
  });
});
