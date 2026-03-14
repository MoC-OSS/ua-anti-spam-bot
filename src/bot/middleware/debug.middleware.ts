import type { GrammyMiddleware } from '@app-types/context';

export const debugMiddleware =
  (name: string): GrammyMiddleware =>
  (context, next) => {
    console.info(name, context);

    return next();
  };
