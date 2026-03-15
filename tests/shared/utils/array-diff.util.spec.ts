import { arrayDiff, setOfArraysDiff } from '@utils/array-diff.util';

describe('arrayDiff', () => {
  describe('positive cases', () => {
    it('should return elements in bigArray that are not in smallArray', () => {
      const result = arrayDiff([1, 2, 3, 4], [1, 2]);

      expect(result).toEqual([3, 4]);
    });

    it('should return all elements when smallArray is empty', () => {
      const result = arrayDiff([1, 2, 3], []);

      expect(result).toEqual([1, 2, 3]);
    });

    it('should return empty array when bigArray is empty', () => {
      const result = arrayDiff([], [1, 2]);

      expect(result).toEqual([]);
    });

    it('should return empty array when both arrays are equal', () => {
      const result = arrayDiff([1, 2, 3], [1, 2, 3]);

      expect(result).toEqual([]);
    });

    it('should work with string arrays', () => {
      const result = arrayDiff(['a', 'b', 'c'], ['b']);

      expect(result).toEqual(['a', 'c']);
    });
  });

  describe('negative cases', () => {
    it('should not include elements from smallArray that are not in bigArray', () => {
      const result = arrayDiff([1, 2], [1, 2, 3, 4]);

      expect(result).toEqual([]);
    });
  });
});

describe('setOfArraysDiff', () => {
  describe('positive cases', () => {
    it('should compute per-key diffs between two record objects', () => {
      const small = { a: ['x', 'y'], b: ['p'] };
      const big = { a: ['x', 'y', 'z'], b: ['p', 'q'] };

      const result = setOfArraysDiff(small, big);

      expect(result).toEqual({ a: ['z'], b: ['q'] });
    });

    it('should return all values when smallSet key is empty', () => {
      const small = { a: [] };
      const big = { a: ['x', 'y'] };

      const result = setOfArraysDiff(small, big);

      expect(result).toEqual({ a: ['x', 'y'] });
    });

    it('should return empty arrays when big and small are equal', () => {
      const small = { a: ['x'] };
      const big = { a: ['x'] };

      const result = setOfArraysDiff(small, big);

      expect(result).toEqual({ a: [] });
    });

    it('should handle empty smallSet values for existing keys', () => {
      const small = { a: [] };
      const big = { a: ['x', 'y'] };

      const result = setOfArraysDiff(small, big);

      expect(result).toEqual({ a: ['x', 'y'] });
    });
  });
});
