import type { GrammyContext, RealGrammyContext } from '../types';
import type { NsfwPhotoResult } from '../types/state';

import { deepCopy } from './deep-copy.util';

/**
 * Optimize real grammy context for logging
 * */
export function optimizeWriteContextUtil(context: GrammyContext): RealGrammyContext {
  const writeContext = deepCopy(context) as RealGrammyContext;
  // noinspection JSConstantReassignment
  delete writeContext.tg;

  /**
   * Remove extra buffers to optimise the output log
   * */
  if (writeContext.state.photo?.file) {
    writeContext.state.photo.file = Buffer.from([]);
  }

  if (writeContext.state.photo && 'fileFrames' in writeContext.state.photo) {
    writeContext.state.photo.fileFrames = [];
  }

  if (writeContext.state.nsfwResult && ((writeContext.state.nsfwResult as NsfwPhotoResult).tensor?.predictions?.length || 0 > 1)) {
    (writeContext.state.nsfwResult as NsfwPhotoResult).tensor.predictions = [];
  }

  return writeContext;
}
