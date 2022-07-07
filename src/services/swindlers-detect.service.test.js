const { mockDynamicStorageService, mockNewUrl } = require('./_mocks/index.mocks');
const { SwindlersBotsService } = require('./swindlers-bots.service');
const { SwindlersCardsService } = require('./swindlers-cards.service');
const { SwindlersDetectService } = require('./swindlers-detect.service');
const { SwindlersUrlsService } = require('./swindlers-urls.service');
const { initSwindlersTensor } = require('../tensor/swindlers-tensor.service');

/**
 * @type {SwindlersDetectService}
 * */
let swindlersDetectService;
/**
 * @type {SwindlersTensorService}
 * */
let swindlersTensorService;
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
    it('should match swindler urls as spam', async () => {
      const text = 'https://da-pay.me/ тест';
      const result = await swindlersDetectService.isSwindlerMessage(text);

      expect(result).toEqual({ isSpam: true, rate: 200, reason: 'site' });
    });

    it('should match similar swindler urls as spam', async () => {
      const text = `${mockNewUrl} test`;
      const result = await swindlersDetectService.isSwindlerMessage(text);

      expect(result.isSpam).toEqual(true);
      expect(result.rate).toBeGreaterThan(0.6);
      expect(result.reason).toEqual('site');
    });
  });
});
