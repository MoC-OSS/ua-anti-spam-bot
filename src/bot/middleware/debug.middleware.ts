import type { GrammyMiddleware } from '../../types';

export const debugMiddleware =
  (name: string): GrammyMiddleware =>
  (context, next) => {
    console.info(name, context);
    return next();
  };
