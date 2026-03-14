import { languageDetectService } from '@services/language-detect.service';

import type { GrammyMiddleware } from '@app-types/context';

export const parseIsRussian: GrammyMiddleware = async (context, next) => {
  if (context.state.isRussian === undefined) {
    context.state.isRussian = languageDetectService.isRussian(context.state.text || '');
  }

  return next();
};
