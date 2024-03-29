import axios from 'axios';

import type { SwindlersTensorService } from '../tensor';
import { initSwindlersTensor } from '../tensor';

import { mockDynamicStorageService, mockNewBot, mockNewUrl } from './_mocks/index.mocks';
import { SwindlersBotsService } from './swindlers-bots.service';
import { SwindlersCardsService } from './swindlers-cards.service';
import { SwindlersDetectService } from './swindlers-detect.service';
import { SwindlersUrlsService } from './swindlers-urls.service';

jest.mock('axios');

const axiosMock = axios as jest.Mocked<typeof axios>;

/**
 * @type {SwindlersDetectService}
 * */
let swindlersDetectService: SwindlersDetectService;
/**
 * @type {SwindlersTensorService}
 * */
let swindlersTensorService: SwindlersTensorService;
const swindlersBotsService = new SwindlersBotsService(mockDynamicStorageService, 0.6);
const swindlersCardsService = new SwindlersCardsService(mockDynamicStorageService);
const swindlersUrlsService = new SwindlersUrlsService(mockDynamicStorageService, 0.6);

describe('SwindlersDetectService', () => {
  beforeAll(async () => {
    swindlersTensorService = await initSwindlersTensor();

    swindlersDetectService = new SwindlersDetectService(
      mockDynamicStorageService,
      swindlersBotsService,
      swindlersCardsService,
      swindlersUrlsService,
      swindlersTensorService,
    );
  });

  describe('isSwindlerMessage', () => {
    describe('swindlersUrlsService', () => {
      it('should match swindler urls as spam', async () => {
        const text = 'https://da-pay.me/ тест';
        const responseUrl = 'https://da-pay.me/';
        axiosMock.get.mockImplementationOnce(() => Promise.resolve({ request: { res: { responseUrl } } }));
        const result = await swindlersDetectService.isSwindlerMessage(text);

        expect(result.isSpam).toEqual(true);
        expect(result.rate).toEqual(200);
        expect(result.reason).toEqual('site');
      });

      it('should match swindler unresolved short url as spam', async () => {
        const text = 'https://privat24.io/ тест';
        const responseUrl = 'https://privat24.io';
        // eslint-disable-next-line prefer-promise-reject-errors
        axiosMock.get.mockImplementationOnce(() => Promise.reject({ response: { headers: { location: responseUrl } } }));
        const result = await swindlersDetectService.isSwindlerMessage(text);

        expect(axiosMock.get).toHaveBeenCalledWith(responseUrl, { maxRedirects: 0 });
        expect(result.isSpam).toEqual(true);
        expect(result.rate).toEqual(200);
        expect(result.reason).toEqual('site');
      });

      it('should match similar swindler urls as spam', async () => {
        const text = `${mockNewUrl} test`;
        axiosMock.get.mockImplementationOnce(() => Promise.resolve({ response: { headers: { location: mockNewUrl } } }));
        const result = await swindlersDetectService.isSwindlerMessage(text);
        expect(result.isSpam).toEqual(true);
        expect(result.rate).toBeGreaterThan(0.6);
        expect(result.reason).toEqual('site');
      });
    });

    describe('swindlersBotsService', () => {
      it('should process message any find swindlers bots', async () => {
        const text = `test message ${mockNewBot} with swindler bot`;
        const result = await swindlersDetectService.isSwindlerMessage(text);

        expect(result.isSpam).toBeTruthy();
        expect(result.rate).toBeGreaterThan(0.6);
        expect(result.reason).toEqual('mention');
        expect(result.match).toEqual('@Diia_aid_bot');
      });
    });
  });
});
