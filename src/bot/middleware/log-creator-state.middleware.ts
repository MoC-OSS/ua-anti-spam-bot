import type { GrammyMiddleware } from '../../types';
import { optimizeWriteContextUtil } from '../../utils';

export const logCreatorState: GrammyMiddleware = async (context, next) => {
  const writeContext = optimizeWriteContextUtil(context);

  await context.reply(JSON.stringify({ isDeleted: !!writeContext.state.isDeleted, ...writeContext.state }, null, 2));
  return next();
};
