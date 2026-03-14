import type { CounteroffensiveService } from '@services/counteroffensive.service';

import type { GrammyMiddleware } from '@app-types/context';

export const parseIsCounteroffensive =
  (counteroffensiveService: CounteroffensiveService): GrammyMiddleware =>
  async (context, next) => {
    if (!context.state.text) {
      return next();
    }

    if (context.state.isCounterOffensive === undefined) {
      context.state.isCounterOffensive = counteroffensiveService.isCounteroffensive(context.state.text);
    }

    return next();
  };
