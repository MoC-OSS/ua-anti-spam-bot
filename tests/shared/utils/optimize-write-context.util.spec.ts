import type { GrammyContext, RealGrammyContext } from '@app-types/context';

import { optimizeWriteContextUtility } from '@utils/optimize-write-context.util';

function buildMockContext(overrides: Partial<RealGrammyContext> = {}): GrammyContext {
  return {
    tg: { token: 'test-token' },
    state: {
      photo: undefined,
      nsfwResult: undefined,
    },
    ...overrides,
  } as unknown as GrammyContext;
}

describe('optimizeWriteContextUtility', () => {
  describe('positive cases', () => {
    it('should return a copy without the tg property', () => {
      const context = buildMockContext();
      const result = optimizeWriteContextUtility(context);

      expect(result).not.toHaveProperty('tg');
    });

    it('should not mutate the original context', () => {
      const context = buildMockContext();

      optimizeWriteContextUtility(context);

      expect(context).toHaveProperty('tg');
    });

    it('should strip the photo file buffer when present', () => {
      const context = buildMockContext({
        state: {
          photo: { type: 'photo', file: Buffer.from([1, 2, 3, 4, 5]) },
          nsfwResult: undefined,
        } as any,
      });

      const result = optimizeWriteContextUtility(context);

      expect((result.state.photo as any)?.file).toEqual(Buffer.from([]));
    });

    it('should strip fileFrames when present', () => {
      const context = buildMockContext({
        state: {
          photo: { type: 'photo', file: null, fileFrames: ['frame1', 'frame2'] },
          nsfwResult: undefined,
        } as any,
      });

      const result = optimizeWriteContextUtility(context);

      expect((result.state.photo as any)?.fileFrames).toEqual([]);
    });

    it('should return object with state intact when no photo', () => {
      const context = buildMockContext({
        state: { photo: undefined, nsfwResult: undefined } as any,
      });

      const result = optimizeWriteContextUtility(context);

      expect(result.state).toBeDefined();
    });

    it('should strip nsfw predictions when present', () => {
      const context = buildMockContext({
        state: {
          photo: undefined,
          nsfwResult: {
            tensor: {
              predictions: [{ className: 'Porn', probability: 0.9 }],
            },
          },
        } as any,
      });

      const result = optimizeWriteContextUtility(context);

      expect((result.state.nsfwResult as any)?.tensor?.predictions).toEqual([]);
    });
  });
});
