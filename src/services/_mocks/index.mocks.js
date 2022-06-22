const { DynamicStorageService } = require('../dynamic-storage.service');

const mockNewBot = '@Diia_move_bot';

/**
 * @type {GoogleService}
 * */
const mockGoogleService = {
  getSheet: () =>
    Promise.resolve([
      {
        value: mockNewBot,
        index: 0,
        sheetKey: 'mock_key',
        fullPath: `mock_path`,
      },
    ]),
};

const mockDataset = {
  swindlers_bots: [
    '@DiaGetMoney_robot',
    '@DiiaHelperBot',
    '@Diia_Help_Ukraine_Bot',
    '@Diia_Receive_bot',
    '@Diia_aid_bot',
    '@Diia_avail_bot',
    '@Diia_helper_2022_bot',
    '@Diia_helpps_bot',
  ],
  immediately: ['test'],
  swindlers_domains: ['olx-ua.darpays.site', 'olx-ua.europe-pays.site', 'olx-ua.glob-payments.site', 'olx-ua.lightpays.online'],
};

const mockDynamicStorageService = new DynamicStorageService(mockGoogleService, mockDataset);

module.exports = {
  mockDataset,
  mockDynamicStorageService,
  mockGoogleService,
  mockNewBot,
};
