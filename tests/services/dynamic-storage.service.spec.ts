import { mockDataset, mockGoogleService, mockSwindlersGoogleService } from '@services/_mocks/index.mocks';
import { DynamicStorageService } from '@services/dynamic-storage.service';

import { logger } from '@utils/logger.util';

/**
 */
let dynamicStorageService: DynamicStorageService;

describe('DynamicStorageService', () => {
  beforeAll(() => {
    dynamicStorageService = new DynamicStorageService(mockSwindlersGoogleService, mockGoogleService, mockDataset);
  });

  it('should init with mock dataset', () => {
    expect(dynamicStorageService.swindlerMessages).toHaveLength(0);
    expect(dynamicStorageService.swindlerMessages).toEqual([]);
    expect(dynamicStorageService.swindlerBots).toStrictEqual(mockDataset.swindlers_bots);
  });

  it('should fetch dataset', async () => {
    await dynamicStorageService.updateStorage();

    expect(dynamicStorageService.swindlerMessages).toHaveLength(1);
    expect(dynamicStorageService.swindlerBots).toEqual(['@Diia_move_bot']);
  });

  it('should emit event on fetch dataset', async () => {
    dynamicStorageService.fetchEmitter.on('fetch', () => {
      logger.info('emmited');
      expect(true).toBeTruthy();
    });

    await dynamicStorageService.updateStorage();
  });
});
