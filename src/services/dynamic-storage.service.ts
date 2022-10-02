import { EventEmitter } from 'node:events';
import type TypedEmitter from 'typed-emitter';
import { optimizeText } from 'ukrainian-ml-optimizer';

import { dataset } from '../../dataset/dataset';

import { SwindlersGoogleService } from './swindlers-google.service';

export type FetchEvents = {
  fetch: () => void;
};

export type LocalDataset = typeof dataset &
  Partial<{
    swindlers_bots: string[];
    swindlers_domains: string[];
    swindlers_cards: string[];
    swindlers_regex_sites: string[];
  }>;

export class DynamicStorageService {
  swindlerMessages: any[];

  swindlerBots: string[];

  swindlerDomains: string[];

  swindlerCards: string[];

  swindlerRegexSites: string[];

  notSwindlers: string[];

  fetchEmitter: TypedEmitter<FetchEvents>;

  /**
   * @param {SwindlersGoogleService} swindlersGoogleService
   * @param {any} localDataset
   * */
  constructor(private swindlersGoogleService: SwindlersGoogleService, localDataset: LocalDataset) {
    this.swindlerMessages = [];
    this.swindlerBots = localDataset.swindlers_bots || [];
    this.swindlerDomains = localDataset.swindlers_domains || [];
    this.swindlerCards = localDataset.swindlers_cards || [];
    this.swindlerRegexSites = localDataset.swindlers_regex_sites || [];
    this.notSwindlers = [];
    this.fetchEmitter = new EventEmitter() as TypedEmitter<FetchEvents>;
  }

  async init() {
    await this.updateSwindlers();
    setInterval(() => {
      this.updateSwindlers().catch((error) => {
        console.error('Cannot update swindlers on interval. Reason:', error);
      });
    }, 1000 * 60 * 60);
  }

  async updateSwindlers() {
    const cases = Promise.all([
      this.swindlersGoogleService.getTrainingPositives(true),
      this.swindlersGoogleService.getBots(true),
      this.swindlersGoogleService.getDomains(),
      this.swindlersGoogleService.getNotSwindlers(),
      this.swindlersGoogleService.getCards(),
      this.swindlersGoogleService.getSiteRegex(),
    ]);

    return cases.then(([swindlerPositives, swindlerBots, swindlerDomains, notSwindlers, swindlerCards, swindlerRegexSites]) => {
      this.swindlerMessages = this.removeDuplicates(swindlerPositives).map(optimizeText).filter(Boolean);
      this.swindlerBots = this.removeDuplicates(swindlerBots);
      this.swindlerDomains = this.removeDuplicates(swindlerDomains);
      this.notSwindlers = this.removeDuplicates(notSwindlers);
      this.swindlerCards = this.removeDuplicates(swindlerCards);
      this.swindlerRegexSites = this.removeDuplicates(swindlerRegexSites);
      this.fetchEmitter.emit('fetch');
      console.info('got DynamicStorageService messages', new Date());
    });
  }

  smartAppend(array1, array2) {
    return this.removeDuplicates([...array1, ...array2]);
  }

  removeDuplicates(array: string[]): string[] {
    return [...new Set(array)];
  }
}
