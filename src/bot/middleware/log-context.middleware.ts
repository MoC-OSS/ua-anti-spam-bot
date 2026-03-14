import type { GrammyMiddleware } from '@app-types/context';

import { logContext } from '@utils/generic.util';

export const logContextMiddleware: GrammyMiddleware = (context, next) => {
  logContext(context);

  return next();
};
