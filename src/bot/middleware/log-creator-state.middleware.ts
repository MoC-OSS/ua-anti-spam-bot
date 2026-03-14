import type { GrammyMiddleware } from '@types/';

import { optimizeWriteContextUtil as optimizeWriteContextUtility } from '@utils/';

export const logCreatorState: GrammyMiddleware = async (context, next) => {
  const writeContext = optimizeWriteContextUtility(context);

  await context.reply(JSON.stringify({ isDeleted: !!writeContext.state.isDeleted, ...writeContext.state }, null, 2), {
    reply_to_message_id: context.state.isDeleted ? undefined : context.msg?.message_id,
  });

  return next();
};
