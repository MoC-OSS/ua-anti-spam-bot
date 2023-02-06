import { languageDetectService } from '../../services';
import type { GrammyMiddleware } from '../../types';

export const parseIsRussian: GrammyMiddleware = async (context, next) => {
  if (context.state.isRussian === undefined) {
    context.state.isRussian = await languageDetectService.isRussian(context.state.text || '');
  }

  return next();
};
