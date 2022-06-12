const { DynamicStorageService } = require('./dynamic-storage.service');
const { mockGoogleService, mockDataset } = require('./_mocks/index.mocks');

/**
 * @type {DynamicStorageService}
 * */
let dynamicStorageService;
describe('DynamicStorageService', () => {
  beforeAll(() => {
    dynamicStorageService = new DynamicStorageService(mockGoogleService, mockDataset);
  });

  it('should init with mock dataset', () => {
    expect(dynamicStorageService.swindlerMessages).toHaveLength(0);
    expect(dynamicStorageService.swindlerMessages).toEqual([]);
    expect(dynamicStorageService.swindlerBots).toStrictEqual(mockDataset.swindlers_bots);
  });

  it('should fetch dataset', async () => {
    await dynamicStorageService.updateSwindlers();

    expect(dynamicStorageService.swindlerMessages).toHaveLength(1);
    expect(dynamicStorageService.swindlerBots).toEqual([...mockDataset.swindlers_bots, '@Diia_move_bot']);
  });

  it('should emit event on fetch dataset', async () => {
    dynamicStorageService.fetchEmmiter.on('fetch', () => {
      console.info('emmited');
      expect(true).toBeTruthy();
    });

    await dynamicStorageService.updateSwindlers();
  });
});
