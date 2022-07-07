const { SwindlersCardsService } = require('./swindlers-cards.service');
const { mockDynamicStorageService } = require('./_mocks/index.mocks');

/**
 * @type {SwindlersCardsService}
 * */
let swindlersCardsService;

describe('SwindlersCardsService', () => {
  beforeAll(() => {
    swindlersCardsService = new SwindlersCardsService(mockDynamicStorageService);
  });

  describe('parseCards', () => {
    it('should parse cards', () => {
      const text = '5555 5555 5555 5555 1114111411141114 1112/1112/1112/1112';
      const result = swindlersCardsService.parseCards(text);

      expect(result).toStrictEqual(['5555555555555555', '1114111411141114', '1112111211121112']);
    });
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
