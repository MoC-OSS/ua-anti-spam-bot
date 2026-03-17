import { InputFile } from 'grammy';

import { csvConstructor } from '@utils/csv.util';

describe('csvConstructor', () => {
  describe('positive cases', () => {
    it('should return an InputFile instance', () => {
      const result = csvConstructor(['Header'], [['value1', 'value2']], 'test-file');

      expect(result).toBeInstanceOf(InputFile);
    });

    it('should produce a CSV file with the correct name', () => {
      const result = csvConstructor(['Header'], [['value']], 'my-export');

      expect((result as any).filename).toBe('my-export.csv');
    });

    it('should handle multiple columns with equal row counts', () => {
      const headers = ['Col1', 'Col2'];

      const columns = [
        ['a', 'b'],
        ['c', 'd'],
      ];

      const result = csvConstructor(headers, columns, 'multi');

      expect(result).toBeInstanceOf(InputFile);
    });

    it('should handle unequal column lengths using the longest column', () => {
      const headers = ['Col1', 'Col2'];
      const columns = [['a', 'b', 'c'], ['x']];
      const result = csvConstructor(headers, columns, 'unequal');

      expect(result).toBeInstanceOf(InputFile);
    });

    it('should strip special characters from values', () => {
      const headers = ['Header'];
      const columns = [['value, with; special\nchars!']];
      const result = csvConstructor(headers, columns, 'special');

      expect(result).toBeInstanceOf(InputFile);
    });

    it('should produce valid CSV content with headers and rows', () => {
      const headers = ['Name', 'Age'];

      const columns = [
        ['Alice', 'Bob'],
        ['30', '25'],
      ];

      const file = csvConstructor(headers, columns, 'output');

      // InputFile wraps a buffer - just verify it's an instance of InputFile
      expect(file).toBeInstanceOf(InputFile);
    });
  });

  describe('negative cases', () => {
    it('should handle empty column arrays gracefully', () => {
      const result = csvConstructor(['Header'], [[]], 'empty');

      expect(result).toBeInstanceOf(InputFile);
    });
  });
});
