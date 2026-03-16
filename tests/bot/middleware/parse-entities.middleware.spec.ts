import type { NextFunction } from 'grammy';

import { parseEntities } from '@bot/middleware/parse-entities.middleware';

import type { GrammyContext } from '@app-types/context';

/**
 *
 * @param overrides
 */
function buildContext(overrides: Partial<GrammyContext> = {}): GrammyContext {
  return {
    state: { text: '' },
    msg: undefined,
    ...overrides,
  } as unknown as GrammyContext;
}

describe('parseEntities', () => {
  let next: NextFunction;

  beforeEach(() => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    next = vi.fn().mockResolvedValue(undefined);
  });

  describe('when msg or text is absent', () => {
    it('should call next without modifying state when msg has no entities', () => {
      const context = buildContext({ state: { text: 'hello' } as any, msg: {} as any });

      parseEntities(context, next);

      expect(context.state.entities).toBeUndefined();
      expect(next).toHaveBeenCalledOnce();
    });

    it('should call next without modifying state when text is absent', () => {
      const context = buildContext({ state: {} as any, msg: { entities: [] } as any });

      parseEntities(context, next);

      expect(context.state.entities).toBeUndefined();
      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe('when entities are present', () => {
    it('should parse text_link entity using entity.url', () => {
      const context = buildContext({
        state: { text: 'click here' } as any,
        msg: {
          entities: [{ type: 'text_link', url: 'https://example.com', offset: 6, length: 4 }],
        } as any,
      });

      parseEntities(context, next);

      expect(context.state.entities).toHaveLength(1);
      expect(context.state.entities![0].value).toBe('https://example.com');
    });

    it('should parse text_mention entity using entity.user', () => {
      const user = { id: 1, first_name: 'Alice', is_bot: false };

      const context = buildContext({
        state: { text: 'hello Alice' } as any,
        msg: {
          entities: [{ type: 'text_mention', user, offset: 6, length: 5 }],
        } as any,
      });

      parseEntities(context, next);

      expect(context.state.entities).toHaveLength(1);
      expect(context.state.entities![0].value).toBe(user);
    });

    it('should parse default entity using sliced text', () => {
      const context = buildContext({
        state: { text: '@testuser hello' } as any,
        msg: {
          entities: [{ type: 'mention', offset: 0, length: 9 }],
        } as any,
      });

      parseEntities(context, next);

      expect(context.state.entities).toHaveLength(1);
      expect(context.state.entities![0].value).toBe('@testuser');
    });

    it('should handle multiple mixed entity types', () => {
      const user = { id: 2, first_name: 'Bob', is_bot: false };

      const context = buildContext({
        state: { text: '@bot click https://x.com' } as any,
        msg: {
          entities: [
            { type: 'mention', offset: 0, length: 4 },
            { type: 'text_mention', user, offset: 5, length: 5 },
            { type: 'text_link', url: 'https://x.com', offset: 11, length: 5 },
          ],
        } as any,
      });

      parseEntities(context, next);

      expect(context.state.entities).toHaveLength(3);
      expect(context.state.entities![0].value).toBe('@bot');
      expect(context.state.entities![1].value).toBe(user);
      expect(context.state.entities![2].value).toBe('https://x.com');
    });
  });
});
