import type { CounteroffensiveService } from '../../services';
import type { GrammyMiddleware } from '../../types';

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
