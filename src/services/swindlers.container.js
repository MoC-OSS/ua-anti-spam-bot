const { dataset } = require('../../dataset/dataset');

const { initSwindlersTensor } = require('../tensor/swindlers-tensor.service');

const { swindlersGoogleService } = require('./swindlers-google.service');
const { DynamicStorageService } = require('./dynamic-storage.service');
const { SwindlersBotsService } = require('./swindlers-bots.service');
const { SwindlersUrlsService } = require('./swindlers-urls.service');
const { SwindlersCardsService } = require('./swindlers-cards.service');
const { SwindlersDetectService } = require('./swindlers-detect.service');

module.exports = {
  initSwindlersContainer: async () => {
    const swindlersTensorService = await initSwindlersTensor();
    swindlersTensorService.setSpamThreshold(0.87);

    const dynamicStorageService = new DynamicStorageService(swindlersGoogleService, dataset);
    await dynamicStorageService.init();

    const swindlersBotsService = new SwindlersBotsService(dynamicStorageService, 0.6);
    const swindlersUrlsService = new SwindlersUrlsService(dynamicStorageService, 0.8);
    const swindlersCardsService = new SwindlersCardsService(dynamicStorageService);

    const swindlersDetectService = new SwindlersDetectService(
      dynamicStorageService,
      swindlersBotsService,
      swindlersCardsService,
      swindlersUrlsService,
      swindlersTensorService,
    );

    return {
      dynamicStorageService,
      swindlersBotsService,
      swindlersCardsService,
      swindlersDetectService,
      swindlersGoogleService,
      swindlersTensorService,
      swindlersUrlsService,
    };
  },
};
