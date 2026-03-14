import type { GrammyMiddleware } from '@app-types/context';

import { optimizeWriteContextUtility } from '@utils/optimize-write-context.util';

export const logCreatorState: GrammyMiddleware = async (context, next) => {
  const writeContext = optimizeWriteContextUtility(context);

  await context.reply(JSON.stringify({ isDeleted: !!writeContext.state.isDeleted, ...writeContext.state }, null, 2), {
    reply_to_message_id: context.state.isDeleted ? undefined : context.msg?.message_id,
  });

  return next();
};
