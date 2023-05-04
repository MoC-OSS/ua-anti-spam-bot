import { EventEmitter } from 'node:events';
import ms from 'ms';
import type TypedEmitter from 'typed-emitter';
import { optimizeText } from 'ukrainian-ml-optimizer';

import type { dataset } from '../../dataset/dataset';
import { environmentConfig } from '../config';
import { removeDuplicates } from '../utils';

import type { GoogleService } from './google.service';
import type { SwindlersGoogleService } from './swindlers-google.service';

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
  private readonly REGEX_KEYWORD = 'REGEX:';

  swindlerMessages: string[] = [];

  swindlerBots: string[] = [];

  swindlerDomains: string[] = [];

  swindlerCards: string[] = [];

  swindlerRegexSites: string[] = [];

  notSwindlers: string[] = [];

  ukrainianLanguageResponses: string[] = [];

  counteroffensiveTriggers: (string | RegExp)[] = [];

  fetchEmitter: TypedEmitter<FetchEvents>;

  /**
   * @param {SwindlersGoogleService} swindlersGoogleService
   * @param {GoogleService} googleService
   * @param {any} localDataset
   * */
  constructor(private swindlersGoogleService: SwindlersGoogleService, private googleService: GoogleService, localDataset: LocalDataset) {
    this.swindlerMessages = [];
    this.swindlerBots = localDataset.swindlers_bots || [];
    this.swindlerDomains = localDataset.swindlers_domains || [];
    this.swindlerCards = localDataset.swindlers_cards || [];
    this.swindlerRegexSites = localDataset.swindlers_regex_sites || [];
    this.notSwindlers = [];
    this.fetchEmitter = new EventEmitter() as TypedEmitter<FetchEvents>;
  }

  async init() {
    await this.updateStorage();
    setInterval(() => {
      this.updateStorage().catch((error) => {
        console.error('Cannot update swindlers on interval. Reason:', error);
      });
    }, ms('1h'));
  }

  async updateStorage() {
    const cases = Promise.all([
      this.swindlersGoogleService.getTrainingPositives(true),
      this.swindlersGoogleService.getBots(),
      this.swindlersGoogleService.getDomains(),
      this.swindlersGoogleService.getNotSwindlers(),
      this.swindlersGoogleService.getCards(),
      this.swindlersGoogleService.getSiteRegex(),
      this.googleService.getSheet(environmentConfig.GOOGLE_SPREADSHEET_ID, 'Ukrainian_phrases', 'A4:A', true),
      this.googleService.getSheet(environmentConfig.GOOGLE_SPREADSHEET_ID, 'Counter_offensive', 'A4:A', true),
    ]);

    return cases.then(
      ([
        swindlerPositives,
        swindlerBots,
        swindlerDomains,
        notSwindlers,
        swindlerCards,
        swindlerRegexSites,
        ukrainianLanguageResponses,
        counteroffensiveTriggers,
      ]) => {
        this.swindlerMessages = removeDuplicates(swindlerPositives)
          .map((element) => optimizeText(element))
          .filter(Boolean);
        this.notSwindlers = removeDuplicates(notSwindlers);
        this.swindlerBots = removeDuplicates(swindlerBots).filter((item) => !this.notSwindlers.includes(item));
        this.swindlerDomains = removeDuplicates(swindlerDomains).filter((item) => !this.notSwindlers.includes(item));
        this.swindlerCards = removeDuplicates(swindlerCards);
        this.swindlerRegexSites = removeDuplicates(swindlerRegexSites);
        this.ukrainianLanguageResponses = ukrainianLanguageResponses;
        this.counteroffensiveTriggers = this.parseRegexItems(counteroffensiveTriggers);
        this.fetchEmitter.emit('fetch');
        console.info('got DynamicStorageService messages', new Date());
      },
    );
  }

  private parseRegexItems(strings: string[]): (string | RegExp)[] {
    return strings.map((string) => {
      if (string.startsWith(this.REGEX_KEYWORD)) {
        return new RegExp(string.slice(this.REGEX_KEYWORD.length));
      }

      return string;
    });
  }
}
