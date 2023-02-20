import type { LocalDataset } from '../dynamic-storage.service';
import { DynamicStorageService } from '../dynamic-storage.service';
import type { GoogleService } from '../google.service';
import type { SwindlersGoogleService } from '../swindlers-google.service';

export const mockNewBot = '@Diia_move_bot';
export const mockNewUrl = 'https://olx.new-darpay.site/some/234234234';

export const getSheet = jest.fn(() =>
  Promise.resolve([
    {
      value: mockNewBot,
      index: 0,
      sheetKey: 'mock_key',
      fullPath: `mock_path`,
    },
  ]),
);

getSheet.mockReturnValueOnce(
  Promise.resolve([
    {
      value: 'test message from swindler',
      index: 0,
      sheetKey: 'mock_key',
      fullPath: `mock_path`,
    },
  ]),
);

const getCompactSheet = jest.fn(() => Promise.resolve([mockNewBot]));
getCompactSheet.mockReturnValueOnce(Promise.resolve(['test message from swindler']));

/**
 * @type {GoogleService}
 * */
export const mockGoogleService = {
  getSheet,
} as Partial<GoogleService> as GoogleService;

/**
 * @type {SwindlersGoogleService}
 * */
export const mockSwindlersGoogleService = {
  getTrainingPositives: getCompactSheet,
  getBots: getCompactSheet,
  getDomains: getCompactSheet,
  getCards: jest.fn(() => Promise.resolve(['4222422242224222'])),
  getNotSwindlers: () => Promise.resolve([]),
  getSiteRegex: () => Promise.resolve([]),
} as Partial<SwindlersGoogleService> as SwindlersGoogleService;

export const mockDataset = {
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
  swindlers_cards: ['4222422242224222'],
  immediately: ['test'],
  swindlers_domains: ['olx-ua.darpays.site', 'olx-ua.europe-pays.site', 'olx-ua.glob-payments.site', 'olx-ua.lightpays.online'],
  swindlers_regex_sites: ['privat24.', 'orpay', 'da-pay', '-pay'],
} as LocalDataset;

export const mockDynamicStorageService = new DynamicStorageService(mockSwindlersGoogleService, mockGoogleService, mockDataset);
