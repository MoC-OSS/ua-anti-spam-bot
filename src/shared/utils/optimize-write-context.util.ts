import type { GrammyContext, RealGrammyContext } from '@app-types/context';
import type { NsfwPhotoResult } from '@app-types/state';

import { deepCopy } from './deep-copy.util';

/**
 * Creates a logging-safe snapshot of the Grammy context with large buffers and tensors stripped.
 *
 * The full context cannot be deep-cloned with `structuredClone` because `context.api` stores
 * functions (e.g. `api.raw`, `api.config`) as own properties, which the structured-clone
 * algorithm rejects with a `DataCloneError`.  Only `context.state` — which contains purely
 * serializable data — is deep-copied so that subsequent buffer-stripping mutations do not
 * affect the live context.  All other properties are shallow-referenced (sufficient for
 * read-only logging).
 */
export function optimizeWriteContextUtility(context: GrammyContext): RealGrammyContext {
  const writeContext = { ...context, state: deepCopy(context.state) } as RealGrammyContext;

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
