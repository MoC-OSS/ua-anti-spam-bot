const { DynamicStorageService } = require('./dynamic-storage.service');

/**
 * @type {GoogleService}
 * */
const mockGoogleService = {
  getSheet: () =>
    Promise.resolve([
      {
        value: 'mock_value',
        index: 0,
        sheetKey: 'mock_key',
        fullPath: `mock_path`,
      },
    ]),
};

const mockDataset = {
  swindlers_bots: ['@test'],
  immediately: ['test'],
};

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
    expect(dynamicStorageService.swindlerBots).toEqual(['@test', 'mock_value']);
  });
});
