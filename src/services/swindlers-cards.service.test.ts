import { mockDynamicStorageService } from './_mocks/index.mocks';
import { SwindlersCardsService } from './swindlers-cards.service';

let swindlersCardsService: SwindlersCardsService;

describe('SwindlersCardsService', () => {
  beforeAll(() => {
    swindlersCardsService = new SwindlersCardsService(mockDynamicStorageService);
  });

  describe('isSpam', () => {
    it('should detect spam card', () => {
      const text = '4222422242224222';
      const result = swindlersCardsService.isSpam(text);

      expect(result).toBe(true);
    });

    it('should not detect spam card', () => {
      const text = '4111422242224222';
      const result = swindlersCardsService.isSpam(text);

      expect(result).toBe(false);
    });
  });
});
