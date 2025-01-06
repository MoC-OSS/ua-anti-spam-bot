import { EventEmitter } from 'node:events';
import ms from 'ms';
import type TypedEmitter from 'typed-emitter';
import { optimizeText } from 'ukrainian-ml-optimizer';

import type { dataset } from '../../dataset/dataset';
import { environmentConfig } from '../config';
import { GOOGLE_SHEETS_NAMES } from '../const';
import { removeDuplicates } from '../utils';

import type { GoogleService } from './google.service';
import type { SwindlersGoogleService } from './swindlers-google.service';

export interface FetchEvents {
  fetch: () => void;
}

export type LocalDataset = typeof dataset &
  Partial<{
    swindlers_bots: string[];
    swindlers_domains: string[];
    swindlers_cards: string[];
    swindlers_regex_sites: string[];
    counteroffensiveTriggers: (string | RegExp)[];
    nsfwMessages: string[];
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

  nsfwMessages: string[] = [];

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
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
    this.counteroffensiveTriggers = localDataset.counteroffensiveTriggers || [];
    this.nsfwMessages = localDataset.nsfwMessages || [];
    this.notSwindlers = [];
    // TODO replace this to EventTarget
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // eslint-disable-next-line unicorn/prefer-event-target
    this.fetchEmitter = new EventEmitter() as TypedEmitter<FetchEvents>;
  }

  async init() {
    if (environmentConfig.DISABLE_GOOGLE_API) {
      return;
    }
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
      this.googleService.getSheet(environmentConfig.GOOGLE_SPREADSHEET_ID, GOOGLE_SHEETS_NAMES.UKRAINIAN_PHRASES, 'A4:A', true),
      this.googleService.getSheet(environmentConfig.GOOGLE_SPREADSHEET_ID, GOOGLE_SHEETS_NAMES.COUNTER_OFFENSIVE, 'A4:A', true),
      this.googleService.getSheet(environmentConfig.GOOGLE_SPREADSHEET_ID, GOOGLE_SHEETS_NAMES.NSFW, 'B3:B', true),
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
        nsfwMessages,
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
        this.nsfwMessages = nsfwMessages;
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
