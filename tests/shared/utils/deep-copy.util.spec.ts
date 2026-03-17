import { deepCopy } from '@utils/deep-copy.util';

describe('deepCopy', () => {
  describe('positive cases', () => {
    it('should return a deep copy of a plain object', () => {
      const original = { a: 1, b: { c: 2 } };
      const copy = deepCopy(original);

      expect(copy).toEqual(original);
      expect(copy).not.toBe(original);
      expect(copy.b).not.toBe(original.b);
    });

    it('should return a deep copy of an array', () => {
      const original = [1, 2, [3, 4]];
      const copy = deepCopy(original);

      expect(copy).toEqual(original);
      expect(copy).not.toBe(original);
      expect(copy[2]).not.toBe(original[2]);
    });

    it('should deep copy nested objects', () => {
      const original = { x: { y: { z: 'deep' } } };
      const copy = deepCopy(original);

      copy.x.y.z = 'modified';

      expect(original.x.y.z).toBe('deep');
    });

    it('should copy primitive values', () => {
      expect(deepCopy(42)).toBe(42);
      expect(deepCopy('hello')).toBe('hello');
      expect(deepCopy(true)).toBe(true);
    });

    it('should copy null', () => {
      expect(deepCopy(null)).toBeNull();
    });

    it('should deep copy arrays of objects without sharing references', () => {
      const original = [{ id: 1 }, { id: 2 }];
      const copy = deepCopy(original);

      copy[0].id = 99;

      expect(original[0].id).toBe(1);
    });
  });
});
