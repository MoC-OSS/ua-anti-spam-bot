import type { CounterOffensiveResult } from '../types/state';

import type { DynamicStorageService } from './dynamic-storage.service';

export class CounteroffensiveService {
  constructor(private dynamicStorageService: DynamicStorageService) {}

  isCounteroffensive(text: string): CounterOffensiveResult {
    const searchText = text.toLowerCase();

    const reason = this.dynamicStorageService.counteroffensiveTriggers.find((trigger) => {
      if (trigger instanceof RegExp) {
        return trigger.test(searchText);
      }

      return searchText.includes(trigger);
    });

    return reason
      ? {
          result: true,
          percent: 100,
          reason,
        }
      : {
          result: false,
          percent: 0,
        };
  }
}
