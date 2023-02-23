import { languageDetectService } from './language-detect.service';

describe('LanguageDetectService', () => {
  describe('isRussian', () => {
    it('should return true if russian', async () => {
      const text = 'съешь еще этих французских булок';
      const result = await languageDetectService.isRussian(text);

      expect(result.result).toEqual(true);
    });

    it('should return true if russian edge case', async () => {
      const text =
        '🗂 Номер телефона\n' +
        '\n' +
        'Вам необходимо подтвердить номер телефона для того, чтобы завершить идентификацию.\n' +
        'Для этого нажмите кнопку ниже.';
      const result = await languageDetectService.isRussian(text);

      expect(result.result).toEqual(true);
    });

    it('should return false if ukrainian edge case', async () => {
      const text = 'Нажерлись гречки і серуть';
      const result = await languageDetectService.isRussian(text);

      expect(result.result).toEqual(false);
    });

    it('should return false if ukrainian', async () => {
      const text = 'Інтернет були взірцем для наслідування для всіх, хто хоче говорити українською правильно';
      const result = await languageDetectService.isRussian(text);

      expect(result.result).toEqual(false);
    });
  });

  describe('detect', () => {
    it('should detect russian', async () => {
      const text = 'съешь еще этих французских булок';
      const result = await languageDetectService.detect(text);

      expect(result).toMatchSnapshot();
    });

    it('should detect surzhik', async () => {
      const text = "Добре утро. Як діла? оплатити білєтіки. пред''явити удостовірєніє";
      const result = await languageDetectService.detect(text);

      expect(result).toMatchSnapshot();
    });

    it('should detect ukrainian', async () => {
      const text = 'Інтернет були взірцем для наслідування для всіх, хто хоче говорити українською правильно';
      const result = await languageDetectService.detect(text);

      expect(result).toMatchSnapshot();
    });

    it('should not detect russian when mixed', async () => {
      const text =
        'съешь еще этих французских булок. Інтернет були взірцем для наслідування для всіх, хто хоче говорити українською правильно.';
      const result = await languageDetectService.detect(text);

      expect(result).toMatchSnapshot();
    });
  });
});
