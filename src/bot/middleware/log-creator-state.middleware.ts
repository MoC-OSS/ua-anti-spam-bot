import type { GrammyMiddleware } from '../../types';
import { deepCopy } from '../../utils';

export const logCreatorState: GrammyMiddleware = async (context, next) => {
  const writeState = deepCopy(context.state);

  if (writeState.photo?.file) {
    writeState.photo.file = Buffer.from([]);
  }

  await context.reply(JSON.stringify({ isDeleted: !!writeState.isDeleted, ...writeState }, null, 2));
  return next();
};
