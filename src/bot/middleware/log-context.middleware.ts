import type { GrammyMiddleware } from '../../types';
import { logContext } from '../../utils';

export const logContextMiddleware: GrammyMiddleware = (context, next) => {
  logContext(context);

  return next();
};
