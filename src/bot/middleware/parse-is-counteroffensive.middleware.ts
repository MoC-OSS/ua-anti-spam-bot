import type { DynamicStorageService } from '../../services';
import type { GrammyMiddleware } from '../../types';

export const parseIsCounteroffensive =
  (dynamicStorageService: DynamicStorageService): GrammyMiddleware =>
  async (context, next) => {
    if (!context.state.text) {
      return next();
    }

    const searchText = context.state.text.toLowerCase();

    if (context.state.isCounterOffensive === undefined) {
      const reason = dynamicStorageService.counteroffensiveTriggers.find((trigger) => {
        if (trigger instanceof RegExp) {
          return trigger.test(searchText);
        }

        return searchText.includes(trigger);
      });

      context.state.isCounterOffensive = reason
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

    return next();
  };
