import { compareDatesWithOffset, formatDate, formatDateIntoAccusative } from '@utils/date-format.util';

describe('formatDate', () => {
  describe('positive cases', () => {
    it('should return a non-empty formatted date string', () => {
      const result = formatDate(new Date('2024-01-15T10:00:00Z'));

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include the year in the formatted date', () => {
      const result = formatDate(new Date('2024-06-01T12:00:00Z'));

      expect(result).toContain('2024');
    });

    it('should return different strings for different dates', () => {
      const result1 = formatDate(new Date('2024-01-01T00:00:00Z'));
      const result2 = formatDate(new Date('2024-06-15T00:00:00Z'));

      expect(result1).not.toBe(result2);
    });
  });
});

describe('formatDateIntoAccusative', () => {
  describe('positive cases', () => {
    it('should return a string', () => {
      const result = formatDateIntoAccusative(new Date('2024-01-15T10:00:00Z'));

      expect(typeof result).toBe('string');
    });

    it('should replace "середа" with "середу"', () => {
      // Find a Wednesday to test
      const wednesday = new Date('2024-01-03T10:00:00Z'); // Jan 3 2024 is a Wednesday
      const result = formatDateIntoAccusative(wednesday);

      expect(result).toContain('середу');
      expect(result).not.toContain('середа');
    });

    it('should return a non-empty string for any date', () => {
      const dates = [
        new Date('2024-01-01T10:00:00Z'),
        new Date('2024-03-08T10:00:00Z'),
        new Date('2024-06-14T10:00:00Z'),
        new Date('2024-11-23T10:00:00Z'),
      ];

      for (const date of dates) {
        const result = formatDateIntoAccusative(date);

        expect(result.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('compareDatesWithOffset', () => {
  describe('positive cases', () => {
    it('should return true when compareDate is more than N hours after initialDate', () => {
      const initial = new Date('2024-01-01T00:00:00Z');
      const compare = new Date('2024-01-01T03:00:00Z'); // 3 hours later

      expect(compareDatesWithOffset(initial, compare, 2)).toBe(true);
    });

    it('should return false when compareDate is less than N hours after initialDate', () => {
      const initial = new Date('2024-01-01T00:00:00Z');
      const compare = new Date('2024-01-01T01:00:00Z'); // 1 hour later

      expect(compareDatesWithOffset(initial, compare, 2)).toBe(false);
    });

    it('should return false when dates are equal', () => {
      const date = new Date('2024-01-01T00:00:00Z');

      expect(compareDatesWithOffset(date, date, 0)).toBe(false);
    });

    it('should handle large hour offsets', () => {
      const initial = new Date('2024-01-01T00:00:00Z');
      const compare = new Date('2024-01-10T00:00:00Z'); // 216 hours later

      expect(compareDatesWithOffset(initial, compare, 200)).toBe(true);
      expect(compareDatesWithOffset(initial, compare, 300)).toBe(false);
    });
  });

  describe('negative cases', () => {
    it('should return false when compareDate is before initialDate', () => {
      const initial = new Date('2024-01-02T00:00:00Z');
      const compare = new Date('2024-01-01T00:00:00Z');

      expect(compareDatesWithOffset(initial, compare, 1)).toBe(false);
    });
  });
});
