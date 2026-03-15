import type { CounteroffensiveService } from '@services/counteroffensive.service';

import type { GrammyMiddleware } from '@app-types/context';

/**
 * Detects whether the message text is related to the counteroffensive and stores the result in `context.state.isCounterOffensive`.
 * Always calls `next()`.
 */
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
