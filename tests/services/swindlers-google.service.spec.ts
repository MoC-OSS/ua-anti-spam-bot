import type { GoogleService } from '@services/google.service';
import { SwindlersGoogleService } from '@services/swindlers-google.service';

vi.mock('@shared/config', () => ({
  environmentConfig: {
    GOOGLE_SPREADSHEET_ID: 'spreadsheet-id',
  },
}));

vi.mock('@const/google-sheets.const', () => ({
  GOOGLE_SHEETS_NAMES: {
    SWINDLERS: 'SWINDLERS',
  },
}));

/**
 *
 */
function buildMockGoogleService() {
  return {
    getSheet: vi.fn().mockResolvedValue([]),
    // eslint-disable-next-line unicorn/no-useless-undefined
    clearSheet: vi.fn().mockResolvedValue(undefined),
    // eslint-disable-next-line unicorn/no-useless-undefined
    updateSheet: vi.fn().mockResolvedValue(undefined),
    // eslint-disable-next-line unicorn/no-useless-undefined
    appendToSheet: vi.fn().mockResolvedValue(undefined),
    // eslint-disable-next-line unicorn/no-useless-undefined
    removeSheetRange: vi.fn().mockResolvedValue(undefined),
    googleAuth: vi.fn(),
  } as unknown as GoogleService;
}

describe('SwindlersGoogleService', () => {
  let googleServiceMock: ReturnType<typeof buildMockGoogleService>;
  let service: SwindlersGoogleService;

  beforeEach(() => {
    vi.clearAllMocks();
    googleServiceMock = buildMockGoogleService();
    service = new SwindlersGoogleService(googleServiceMock);
  });

  describe('getBots', () => {
    describe('positive cases', () => {
      it('should call getSheet with bots range', async () => {
        vi.mocked(googleServiceMock.getSheet).mockResolvedValueOnce(['@bot1', '@bot2'] as any);

        const result = await service.getBots();

        expect(googleServiceMock.getSheet).toHaveBeenCalledWith('spreadsheet-id', 'SWINDLERS', expect.stringContaining('C'), true);
        expect(result).toEqual(['@bot1', '@bot2']);
      });
    });
  });

  describe('getDomains', () => {
    describe('positive cases', () => {
      it('should call getSheet with domains range', async () => {
        vi.mocked(googleServiceMock.getSheet).mockResolvedValueOnce(['domain.com'] as any);

        const result = await service.getDomains();

        expect(googleServiceMock.getSheet).toHaveBeenCalledWith('spreadsheet-id', 'SWINDLERS', expect.stringContaining('D'), true);
        expect(result).toEqual(['domain.com']);
      });
    });
  });

  describe('getCards', () => {
    describe('positive cases', () => {
      it('should call getSheet with cards range', async () => {
        vi.mocked(googleServiceMock.getSheet).mockResolvedValueOnce(['4222422242224222'] as any);

        const result = await service.getCards();

        expect(googleServiceMock.getSheet).toHaveBeenCalledWith('spreadsheet-id', 'SWINDLERS', expect.stringContaining('I'), true);
        expect(result).toEqual(['4222422242224222']);
      });
    });
  });

  describe('getNotSwindlers', () => {
    describe('positive cases', () => {
      it('should call getSheet with not-swindlers range', async () => {
        vi.mocked(googleServiceMock.getSheet).mockResolvedValueOnce(['safe.com'] as any);

        const result = await service.getNotSwindlers();

        expect(googleServiceMock.getSheet).toHaveBeenCalledWith('spreadsheet-id', 'SWINDLERS', expect.stringContaining('J'), true);
        expect(result).toEqual(['safe.com']);
      });
    });
  });

  describe('getSiteRegex', () => {
    describe('positive cases', () => {
      it('should call getSheet with site-regex range', async () => {
        vi.mocked(googleServiceMock.getSheet).mockResolvedValueOnce([String.raw`^spam\.`] as any);

        const result = await service.getSiteRegex();

        expect(googleServiceMock.getSheet).toHaveBeenCalledWith('spreadsheet-id', 'SWINDLERS', expect.stringContaining('K'), true);
        expect(result).toEqual([String.raw`^spam\.`]);
      });
    });
  });

  describe('getTrainingPositives', () => {
    describe('positive cases', () => {
      it('should call getSheet in compact mode by default', async () => {
        vi.mocked(googleServiceMock.getSheet).mockResolvedValueOnce(['positive msg'] as any);

        const result = await service.getTrainingPositives();

        expect(googleServiceMock.getSheet).toHaveBeenCalledWith('spreadsheet-id', 'SWINDLERS', expect.stringContaining('B'), true);
        expect(result).toEqual(['positive msg']);
      });

      it('should call getSheet in full mode when compact is false', async () => {
        vi.mocked(googleServiceMock.getSheet).mockResolvedValueOnce([{ value: 'msg', index: 7 }] as any);

        const result = await service.getTrainingPositives(false);

        expect(googleServiceMock.getSheet).toHaveBeenCalledWith('spreadsheet-id', 'SWINDLERS', expect.stringContaining('B'), false);
        expect(result).toEqual([{ value: 'msg', index: 7 }]);
      });
    });
  });

  describe('getTrainingNegatives', () => {
    describe('positive cases', () => {
      it('should call getSheet with training negatives range', async () => {
        vi.mocked(googleServiceMock.getSheet).mockResolvedValueOnce(['neg1'] as any);

        const result = await service.getTrainingNegatives();

        expect(googleServiceMock.getSheet).toHaveBeenCalledWith('spreadsheet-id', 'SWINDLERS', expect.stringContaining('A'), true);
        expect(result).toEqual(['neg1']);
      });
    });
  });

  describe('updateBots', () => {
    describe('positive cases', () => {
      it('should call updateSheet with bots', async () => {
        await service.updateBots(['@bot1', '@bot2']);

        expect(googleServiceMock.updateSheet).toHaveBeenCalledWith(
          'spreadsheet-id',
          'SWINDLERS',
          ['@bot1', '@bot2'],
          expect.stringContaining('C'),
        );
      });
    });
  });

  describe('updateDomains', () => {
    describe('positive cases', () => {
      it('should call updateSheet with domains', async () => {
        await service.updateDomains(['domain.com']);

        expect(googleServiceMock.updateSheet).toHaveBeenCalledWith(
          'spreadsheet-id',
          'SWINDLERS',
          ['domain.com'],
          expect.stringContaining('D'),
        );
      });
    });
  });

  describe('updateCards', () => {
    describe('positive cases', () => {
      it('should call updateSheet with cards', async () => {
        await service.updateCards(['1234567890123456']);

        expect(googleServiceMock.updateSheet).toHaveBeenCalledWith(
          'spreadsheet-id',
          'SWINDLERS',
          ['1234567890123456'],
          expect.stringContaining('I'),
        );
      });
    });
  });

  describe('clearBots', () => {
    describe('positive cases', () => {
      it('should call clearSheet with bots range', async () => {
        await service.clearBots();

        expect(googleServiceMock.clearSheet).toHaveBeenCalledWith('spreadsheet-id', 'SWINDLERS', expect.stringContaining('C'));
      });
    });
  });

  describe('appendBot', () => {
    describe('positive cases', () => {
      it('should call getSheet, clearSheet, and updateSheet', async () => {
        vi.mocked(googleServiceMock.getSheet).mockResolvedValueOnce(['@existingbot'] as any);

        await service.appendBot('@newbot');

        expect(googleServiceMock.clearSheet).toHaveBeenCalled();

        expect(googleServiceMock.updateSheet).toHaveBeenCalledWith(
          'spreadsheet-id',
          'SWINDLERS',
          ['@existingbot', '@newbot'],
          expect.stringContaining('C'),
        );
      });
    });
  });

  describe('getSites', () => {
    describe('positive cases', () => {
      it('should call getSheet with sites range', async () => {
        vi.mocked(googleServiceMock.getSheet).mockResolvedValueOnce(['site.com'] as any);

        const result = await service.getSites();

        expect(googleServiceMock.getSheet).toHaveBeenCalledWith('spreadsheet-id', 'SWINDLERS', expect.stringContaining('G'), true);
        expect(result).toEqual(['site.com']);
      });
    });
  });

  describe('getUsers', () => {
    describe('positive cases', () => {
      it('should call getSheet with users range', async () => {
        vi.mocked(googleServiceMock.getSheet).mockResolvedValueOnce(['user123'] as any);

        const result = await service.getUsers();

        expect(googleServiceMock.getSheet).toHaveBeenCalledWith('spreadsheet-id', 'SWINDLERS', expect.stringContaining('H'), true);
        expect(result).toEqual(['user123']);
      });
    });
  });

  describe('clearTrainingNegatives', () => {
    describe('positive cases', () => {
      it('should call clearSheet with training negatives range', async () => {
        await service.clearTrainingNegatives();

        expect(googleServiceMock.clearSheet).toHaveBeenCalledWith('spreadsheet-id', 'SWINDLERS', expect.stringContaining('A'));
      });
    });
  });

  describe('clearTrainingPositives', () => {
    describe('positive cases', () => {
      it('should call clearSheet with training positives range', async () => {
        await service.clearTrainingPositives();

        expect(googleServiceMock.clearSheet).toHaveBeenCalledWith('spreadsheet-id', 'SWINDLERS', expect.stringContaining('B'));
      });
    });
  });

  describe('updateTrainingNegatives', () => {
    describe('positive cases', () => {
      it('should call updateSheet with training negatives', async () => {
        await service.updateTrainingNegatives(['neg1', 'neg2']);

        expect(googleServiceMock.updateSheet).toHaveBeenCalledWith(
          'spreadsheet-id',
          'SWINDLERS',
          ['neg1', 'neg2'],
          expect.stringContaining('A'),
        );
      });
    });
  });

  describe('updateTrainingPositives', () => {
    describe('positive cases', () => {
      it('should call updateSheet with training positives', async () => {
        await service.updateTrainingPositives(['pos1', 'pos2']);

        expect(googleServiceMock.updateSheet).toHaveBeenCalledWith(
          'spreadsheet-id',
          'SWINDLERS',
          ['pos1', 'pos2'],
          expect.stringContaining('B'),
        );
      });
    });
  });

  describe('getTestingNegatives', () => {
    describe('positive cases', () => {
      it('should call getSheet with testing negatives range', async () => {
        vi.mocked(googleServiceMock.getSheet).mockResolvedValueOnce(['tneg1'] as any);

        const result = await service.getTestingNegatives();

        expect(googleServiceMock.getSheet).toHaveBeenCalledWith('spreadsheet-id', 'SWINDLERS', expect.stringContaining('E'), true);
        expect(result).toEqual(['tneg1']);
      });
    });
  });

  describe('getTestingPositives', () => {
    describe('positive cases', () => {
      it('should call getSheet with testing positives range', async () => {
        vi.mocked(googleServiceMock.getSheet).mockResolvedValueOnce(['tpos1'] as any);

        const result = await service.getTestingPositives();

        expect(googleServiceMock.getSheet).toHaveBeenCalledWith('spreadsheet-id', 'SWINDLERS', expect.stringContaining('F'), true);
        expect(result).toEqual(['tpos1']);
      });
    });
  });

  describe('updateSites', () => {
    describe('positive cases', () => {
      it('should call updateSheet with sites', async () => {
        await service.updateSites(['newsite.com']);

        expect(googleServiceMock.updateSheet).toHaveBeenCalledWith(
          'spreadsheet-id',
          'SWINDLERS',
          ['newsite.com'],
          expect.stringContaining('G'),
        );
      });
    });
  });

  describe('appendTrainingPositives', () => {
    describe('positive cases', () => {
      it('should append a single positive case', async () => {
        vi.mocked(googleServiceMock.getSheet).mockResolvedValueOnce([
          { value: 'existing', index: 7, sheetKey: 'B', fullPath: 'SWINDLERS!B7' },
        ] as any);

        await service.appendTrainingPositives('new case');

        expect(googleServiceMock.appendToSheet).toHaveBeenCalledWith('spreadsheet-id', 'SWINDLERS', 'new case', 'B8');
      });
    });
  });
});
