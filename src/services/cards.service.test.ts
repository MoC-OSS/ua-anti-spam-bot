import { cardsService } from './cards.service';

describe('CardsService', () => {
  describe('parseCards', () => {
    it('should parse cards', () => {
      const text = '4111 1111 4555 1142 4111112014267661 4988/4388/4388/4305';
      const result = cardsService.parseCards(text);

      expect(result).toStrictEqual(['4111111145551142', '4111112014267661', '4988438843884305']);
    });

    it('should not parse invalid cards', () => {
      const text = '5555 5555 5555 5555 1114111411141114 1112/1112/1112/1112';
      const result = cardsService.parseCards(text);

      expect(result).toStrictEqual([]);
    });

    it('should not parse cards bigger than 16 digits', () => {
      const text = '7035633400000262074';
      const result = cardsService.parseCards(text);

      expect(result).toStrictEqual([]);
    });
  });
});
