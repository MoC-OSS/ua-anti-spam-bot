import { GoogleService } from '@services/google.service';

const { mockSheetsGet, mockSheetsClear, mockSheetsAppend, mockSheetsUpdate } = vi.hoisted(() => ({
  mockSheetsGet: vi.fn(),
  mockSheetsClear: vi.fn(),
  mockSheetsAppend: vi.fn(),
  mockSheetsUpdate: vi.fn(),
}));

vi.mock('googleapis', () => ({
  google: {
    sheets: vi.fn(() => ({
      spreadsheets: {
        values: {
          get: mockSheetsGet,
          clear: mockSheetsClear,
          append: mockSheetsAppend,
          update: mockSheetsUpdate,
        },
      },
    })),
    options: vi.fn(),
  },
}));

vi.mock('google-auth-library', () => ({
  // eslint-disable-next-line func-names
  JWT: vi.fn().mockImplementation(function () {
    return {};
  }),
}));

vi.mock('@shared/config', () => ({
  environmentConfig: {
    GOOGLE_CREDITS: JSON.stringify({
      client_email: 'test@test.com',
      private_key: 'test-key',
    }),
    GOOGLE_SPREADSHEET_ID: 'spreadsheet-id',
  },
}));

describe('GoogleService', () => {
  let service: GoogleService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GoogleService();
  });

  describe('getSheet', () => {
    describe('positive cases', () => {
      it('should return full cell data when compact is false', async () => {
        mockSheetsGet.mockResolvedValueOnce({
          data: {
            range: 'Sheet1!A7:A10',
            values: [['value1'], ['value2'], ['value3']],
          },
        });

        const result = await service.getSheet('spreadsheet-id', 'Sheet1', 'A7:A');

        expect(result.length).toBe(3);
        expect(result[0]).toHaveProperty('value', 'value1');
        expect(result[0]).toHaveProperty('index');
        expect(result[0]).toHaveProperty('sheetKey');
        expect(result[0]).toHaveProperty('fullPath');
      });

      it('should return compact string array when compact is true', async () => {
        mockSheetsGet.mockResolvedValueOnce({
          data: {
            range: 'Sheet1!A7:A10',
            values: [['val1'], ['val2']],
          },
        });

        const result = await service.getSheet('spreadsheet-id', 'Sheet1', 'A7:A', true);

        expect(result).toEqual(['val1', 'val2']);
      });

      it('should return empty array when values is null', async () => {
        mockSheetsGet.mockResolvedValueOnce({
          data: {
            range: 'Sheet1!A7:A',
            values: null,
          },
        });

        const result = await service.getSheet('spreadsheet-id', 'Sheet1');

        expect(result).toEqual([]);
      });

      it('should filter out empty values', async () => {
        mockSheetsGet.mockResolvedValueOnce({
          data: {
            range: 'Sheet1!A7:A10',
            values: [['value1'], [''], ['value3']],
          },
        });

        const result = await service.getSheet('spreadsheet-id', 'Sheet1');

        expect(result.length).toBe(2);
      });
    });

    describe('negative cases', () => {
      it('should return empty array on API error', async () => {
        mockSheetsGet.mockRejectedValueOnce(new Error('API error'));

        const result = await service.getSheet('spreadsheet-id', 'Sheet1');

        expect(result).toEqual([]);
      });
    });
  });

  describe('removeSheetRange', () => {
    describe('positive cases', () => {
      it('should call clear with the correct range', async () => {
        mockSheetsClear.mockResolvedValueOnce({});

        await service.removeSheetRange('spreadsheet-id', 'Sheet1!A1:A10');

        expect(mockSheetsClear).toHaveBeenCalledWith({
          spreadsheetId: 'spreadsheet-id',
          range: 'Sheet1!A1:A10',
        });
      });
    });

    describe('negative cases', () => {
      it('should return null on error', () => {
        mockSheetsClear.mockImplementationOnce(() => {
          throw new Error('API error');
        });

        const result = service.removeSheetRange('spreadsheet-id', 'Sheet1!A1:A10');

        expect(result).toBeNull();
      });
    });
  });

  describe('appendToSheet', () => {
    describe('positive cases', () => {
      it('should call append with single value', async () => {
        mockSheetsAppend.mockResolvedValueOnce({});

        await service.appendToSheet('spreadsheet-id', 'Sheet1', 'newvalue');

        expect(mockSheetsAppend).toHaveBeenCalledWith(
          expect.objectContaining({
            spreadsheetId: 'spreadsheet-id',
            requestBody: { values: [['newvalue']] },
          }),
        );
      });

      it('should call append with array value', async () => {
        mockSheetsAppend.mockResolvedValueOnce({});

        await service.appendToSheet('spreadsheet-id', 'Sheet1', ['val1', 'val2']);

        expect(mockSheetsAppend).toHaveBeenCalledWith(
          expect.objectContaining({
            requestBody: { values: [['val1', 'val2']] },
          }),
        );
      });
    });

    describe('negative cases', () => {
      it('should not throw on API error', async () => {
        mockSheetsAppend.mockRejectedValueOnce(new Error('API error'));

        await expect(service.appendToSheet('spreadsheet-id', 'Sheet1', 'value')).resolves.not.toThrow();
      });
    });
  });

  describe('updateSheet', () => {
    describe('positive cases', () => {
      it('should call update with correct parameters', async () => {
        mockSheetsUpdate.mockResolvedValueOnce({});

        await service.updateSheet('spreadsheet-id', 'Sheet1', ['val1', 'val2']);

        expect(mockSheetsUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            spreadsheetId: 'spreadsheet-id',
            requestBody: { values: [['val1'], ['val2']] },
          }),
        );
      });
    });

    describe('negative cases', () => {
      it('should not throw on API error', async () => {
        mockSheetsUpdate.mockRejectedValueOnce(new Error('API error'));

        await expect(service.updateSheet('spreadsheet-id', 'Sheet1', [])).resolves.not.toThrow();
      });
    });
  });

  describe('clearSheet', () => {
    describe('positive cases', () => {
      it('should call clear with the computed range', async () => {
        mockSheetsClear.mockResolvedValueOnce({});

        await service.clearSheet('spreadsheet-id', 'Sheet1');

        expect(mockSheetsClear).toHaveBeenCalledWith(
          expect.objectContaining({
            spreadsheetId: 'spreadsheet-id',
            range: 'Sheet1!A7:A',
          }),
        );
      });

      it('should use custom range when provided', async () => {
        mockSheetsClear.mockResolvedValueOnce({});

        await service.clearSheet('spreadsheet-id', 'Sheet1', 'B1:B');

        expect(mockSheetsClear).toHaveBeenCalledWith(
          expect.objectContaining({
            range: 'Sheet1!B1:B',
          }),
        );
      });
    });

    describe('negative cases', () => {
      it('should not throw on API error', async () => {
        mockSheetsClear.mockRejectedValueOnce(new Error('API error'));

        await expect(service.clearSheet('spreadsheet-id', 'Sheet1')).resolves.not.toThrow();
      });
    });
  });
});
