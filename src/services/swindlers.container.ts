import { dataset } from '../../dataset/dataset';

import { initSwindlersTensor } from '../tensor/swindlers-tensor.service';

import{ swindlersGoogleService } from './swindlers-google.service';
import { DynamicStorageService } from './dynamic-storage.service';
import { SwindlersBotsService } from './swindlers-bots.service';
import { SwindlersUrlsService } from './swindlers-urls.service';
import { SwindlersCardsService } from './swindlers-cards.service';
import { SwindlersDetectService } from './swindlers-detect.service';

export const initSwindlersContainer = async () => {
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
