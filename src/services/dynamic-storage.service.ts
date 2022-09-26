import { SwindlersGoogleService } from './swindlers-google.service';

const { optimizeText } = require('ukrainian-ml-optimizer');
const EventEmitter = require('events');

export class DynamicStorageService {
  /**
   * @param {SwindlersGoogleService} swindlersGoogleService
   * @param {any} dataset
   * */
  swindlersGoogleService: SwindlersGoogleService;
  swindlerMessages: any[];
  swindlerBots: string[];
  swindlerDomains: string[];
  swindlerCards: string[];
  swindlerRegexSites: string[];
  notSwindlers: string[];
  fetchEmmiter: typeof EventEmitter;

  constructor(swindlersGoogleService, dataset) {
    this.swindlersGoogleService = swindlersGoogleService;
    this.swindlerMessages = [];
    this.swindlerBots = dataset.swindlers_bots || [];
    this.swindlerDomains = dataset.swindlers_domains || [];
    this.swindlerCards = dataset.swindlers_cards || [];
    this.swindlerRegexSites = dataset.swindlers_regex_sites || [];
    this.notSwindlers = [];
    this.fetchEmmiter = new EventEmitter();
  }

  async init() {
    await this.updateSwindlers();
    setInterval(() => {
      this.updateSwindlers();
    }, 1000 * 60 * 60);
  }

  async updateSwindlers() {
    const cases = Promise.all([
      this.swindlersGoogleService.getTrainingPositives(),
      this.swindlersGoogleService.getBots(),
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
      this.fetchEmmiter.emit('fetch');
      console.info('got DynamicStorageService messages', new Date());
    });
  }

  smartAppend(arr1, arr2) {
    return this.removeDuplicates([...arr1, ...arr2]);
  }

  removeDuplicates(array: string[]): string[] {
    return [...new Set(array)];
  }
}
